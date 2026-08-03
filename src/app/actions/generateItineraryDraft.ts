'use server';

import { auth0 } from '@/lib/auth0';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { GenerateDraftInput } from '@/lib/itineraryDraft/types';
import { checkDraftAccess } from '@/lib/itineraryDraft/access';
import {
  acquireGenerationLock,
  releaseGenerationLock,
  consumeOnSuccess,
} from '@/lib/points/points';
import { checkFeasibility } from '@/lib/itineraryDraft/feasibility';
import { buildPolyline } from '@/lib/itineraryDraft/geo';
import {
  buildCandidatesByNight,
  getExcludedTypesFromCar,
} from '@/lib/itineraryDraft/candidates';
import { anthropicDraftLlm } from '@/lib/itineraryDraft/llm';
import {
  buildDraftFromLlm,
  DraftRetryableError,
} from '@/lib/itineraryDraft/validate';
import { draftLog } from '@/lib/itineraryDraft/debug';
import { captureServerEvent } from '@/lib/posthogServer';

export type GenerateDraftResult =
  | {
      success: true;
      draft: ClientItineraryInput;
      notes: string[];
      /** 生成後の残高（アズキ）。null = 無制限枠（消費しない）。 */
      remaining: number | null;
    }
  | { success: false; error: string; suggestion?: string };

/**
 * AI旅程ドラフト生成（ADR-0008 / ADR-0009）。
 * コードが実在スポットの候補プールを作り、LLMが制約下で選択・生成し、
 * 決定的な三重検証を経て ClientItineraryInput を返す。保存はしない（ドラフト）。
 */
export async function generateItineraryDraftAction(
  input: GenerateDraftInput,
): Promise<GenerateDraftResult> {
  // 例外時にも計測できるよう、outer catch から参照する値は try の外で宣言する。
  let distinctId: string | null = null;
  let tStart = Date.now();
  let baseProps: () => Record<string, unknown> = () => ({});

  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return { success: false, error: '認証されていません' };
    }

    // ADR-0009 / ADR-0010: アクセス判定（無制限枠 or ポイント残高）の口
    const access = await checkDraftAccess(session.user);
    if (!access.allowed) {
      return { success: false, error: access.reason ?? '利用できません' };
    }

    // 計測用（ADR-0005 / ADR-0008）: 生成の成否をサーバーで確実に記録する。
    // distinct_id はクライアント identify と同じ Auth0 sub。PII は送らない。
    distinctId = session.user.sub;
    tStart = Date.now();
    // 入力の enum/数値のみ（自由入力の地名・住所は含めない）。
    baseProps = () => ({
      numberOfNights: input.numberOfNights,
      dailyDistanceKm: input.dailyDistanceKm,
      persona: input.persona,
      destinationsCount: input.destinations?.length ?? 0,
      roundTrip: input.roundTrip === true,
      departureTimeOfDay: input.departureTimeOfDay,
      useExpressways: input.useExpressways === true,
      carHeightOver21m: input.carHeightOver21m === true,
      carLengthOver5m: input.carLengthOver5m === true,
      unlimited: access.unlimited === true,
    });

    // 入力の基本チェック
    if (!input.startLocation?.location) {
      return { success: false, error: '出発地を指定してください' };
    }
    if (!input.destinations || input.destinations.length < 1) {
      return { success: false, error: '目的地を1つ以上指定してください' };
    }
    if (!Number.isFinite(input.numberOfNights) || input.numberOfNights < 1) {
      return { success: false, error: '泊数は1以上で指定してください' };
    }
    if (!Number.isFinite(input.dailyDistanceKm) || input.dailyDistanceKm <= 0) {
      return { success: false, error: '1日の走行距離を指定してください' };
    }

    // ADR-0008: 実現不可能な入力は LLM を呼ぶ前にコードで弾く
    const feasibility = checkFeasibility({
      start: input.startLocation.location,
      destinations: input.destinations.map((d) => d.location),
      numberOfNights: input.numberOfNights,
      dailyDistanceKm: input.dailyDistanceKm,
      roundTrip: input.roundTrip,
    });
    if (!feasibility.feasible) {
      await captureServerEvent('draft_generate_failed', distinctId, {
        ...baseProps(),
        reason: 'infeasible',
      });
      return {
        success: false,
        error: '指定の泊数・走行距離では実現が難しい行程です',
        suggestion: feasibility.message,
      };
    }

    await ensureDbConnection();

    // 診断用（一時ログ）: 段階別の所要時間で48秒の内訳を特定する
    const tCandidatesStart = Date.now();

    // 経路と候補プールの構築
    const polyline = buildPolyline(
      input.startLocation.location,
      input.destinations.map((d) => d.location),
      input.roundTrip,
    );
    const excludedTypes = getExcludedTypesFromCar(
      input.carHeightOver21m,
      input.carLengthOver5m,
    );
    const nightPools = await buildCandidatesByNight(
      polyline,
      input.numberOfNights,
      input.persona,
      excludedTypes,
    );
    // 走行日数 = 泊数 + 1。最終日は帰着日で泊地なし（空の候補）。
    const candidatesByDay = [...nightPools, []];

    draftLog('candidates', {
      candidatesMs: Date.now() - tCandidatesStart,
      perNight: nightPools.map((p) => p.length),
    });

    const email = session.user.email;
    if (!email) {
      return { success: false, error: 'メールアドレスが取得できません' };
    }
    const owner = {
      id: session.user.sub,
      name: session.user.name ?? '',
      email,
    };

    // ADR-0010（改訂）: 生成ロック＋成功後デクリメント。無制限枠（whitelist）は消費・ロックしない。
    // ロックで 1ユーザー1生成に直列化し「残高チェック→消費の時間差に並行投入するずる」を防ぐ。
    // 消費は成功したときだけ行うので、タイムアウト・クラッシュで途中終了しても残高は減らない。
    const unlimited = access.unlimited === true;
    let remaining: number | null = unlimited ? null : (access.balance ?? 0);

    if (!unlimited) {
      const locked = await acquireGenerationLock(email);
      if (!locked) {
        await captureServerEvent('draft_generate_failed', distinctId, {
          ...baseProps(),
          reason: 'locked',
        });
        return {
          success: false,
          error:
            '現在この生成を処理中です。完了までしばらくお待ちください。',
        };
      }
    }

    try {
      // LLM生成 → 検証。候補id違反・スキーマ不整合は1回だけ修正指示付きで再試行。
      let lastError: DraftRetryableError | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const llm = await anthropicDraftLlm.generate(
            input,
            candidatesByDay,
            attempt > 0 ? (lastError?.message ?? undefined) : undefined,
          );
          const tValidate = Date.now();
          const { draft, notes } = await buildDraftFromLlm({
            llm,
            input,
            candidatesByDay,
            owner,
          });
          draftLog('validate', {
            validateMs: Date.now() - tValidate,
            attempt,
          });
          // 成功したときだけ消費する（成功後デクリメント）。ここまで来なければ残高は減らない。
          if (!unlimited) {
            const c = await consumeOnSuccess(email);
            remaining = c.balance;
          }
          await captureServerEvent('draft_generate_succeeded', distinctId, {
            ...baseProps(),
            durationMs: Date.now() - tStart,
            notesCount: notes.length,
            attempt,
          });
          return { success: true, draft, notes, remaining };
        } catch (e) {
          if (e instanceof DraftRetryableError) {
            lastError = e;
            continue;
          }
          throw e;
        }
      }

      logger.warn('旅程ドラフト生成が検証を通らずに失敗', {
        detail: lastError?.message ?? '',
      });
      await captureServerEvent('draft_generate_failed', distinctId, {
        ...baseProps(),
        durationMs: Date.now() - tStart,
        reason: 'validation',
      });
      return {
        success: false,
        error:
          '旅程ドラフトの生成に失敗しました。条件を変えて再度お試しください。',
      };
    } finally {
      // ロックを解放する（成功・失敗どちらでも）。タイムアウト時のみ漏れうるが、
      // ロックは残高に影響せず TTL 経過で自動的に奪取できるため、お金は消えない。
      if (!unlimited) {
        try {
          await releaseGenerationLock(email);
        } catch (unlockErr) {
          logger.error(
            unlockErr instanceof Error
              ? unlockErr
              : new Error('生成ロックの解放に失敗'),
            { email },
          );
        }
      }
    }
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error generating itinerary draft'),
    );
    if (distinctId) {
      await captureServerEvent('draft_generate_failed', distinctId, {
        ...baseProps(),
        durationMs: Date.now() - tStart,
        reason: 'exception',
      });
    }
    return { success: false, error: '旅程ドラフトの生成に失敗しました' };
  }
}
