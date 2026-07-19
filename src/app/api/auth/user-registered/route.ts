import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import resend from '@/lib/resend';
import { logger } from '@/lib/logger';
import { auth0Management } from '@/lib/auth0Management';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Auth0 Actionからのwebhook想定だが未認証で到達可能なため、
// メール爆撃対策としてIPごとに10分間で5回までに制限
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isValidWebhookSecret(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  try {
    // 共有シークレットによるwebhook検証(フェイルクローズ)
    // AUTH0_WEBHOOK_SECRETを設定し、Auth0 Action側で同じ値を
    // Authorization: Bearer <secret> ヘッダーに付与すること
    const webhookSecret = process.env.AUTH0_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error(
        new Error(
          '[ユーザー登録通知] AUTH0_WEBHOOK_SECRETが未設定のためwebhookを拒否しました',
        ),
      );
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    if (
      !providedSecret ||
      !isValidWebhookSecret(providedSecret, webhookSecret)
    ) {
      logger.warn('[ユーザー登録通知] webhookシークレット不一致', {
        ip: getClientIp(request),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit({
      key: `user-registered:${ip}`,
      limit: RATE_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimitResult.allowed) {
      logger.warn('[ユーザー登録通知] レート制限超過', { ip });
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const { userId, email, name, createdAt } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.error(new Error('ADMIN_EMAIL environment variable not set'));
      return NextResponse.json(
        { error: 'Admin email not configured' },
        { status: 500 },
      );
    }

    // ユーザー統計を取得
    let userStats;
    try {
      userStats = await auth0Management.getUserStats();
    } catch (error) {
      logger.warn('Failed to get user stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      userStats = null;
    }

    // メール送信を試行（失敗してもWebhookは成功扱い）
    const result = await resend.sendUserRegistrationNotification({
      userId,
      userEmail: email,
      userName: name || 'Unknown',
      createdAt,
      adminEmail,
      userStats,
    });

    if (!result.success) {
      logger.error(
        new Error(`[ユーザー登録通知] メール送信失敗: ${result.error}`),
        { userId, isConfigError: result.isConfigError },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error in user registration webhook'),
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
