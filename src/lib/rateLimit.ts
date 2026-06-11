import { NextRequest } from 'next/server';

// インメモリ固定ウィンドウ方式のレート制限。
// サーバーレス環境ではインスタンスごとに独立したカウントとなるため
// 厳密な制限にはならないが、単一IPからの連続送信(スパム・メール爆撃)への
// 最低限の防御として機能する。厳密な制限が必要になった場合は
// Upstash Redis 等の外部ストアへの移行を検討すること。

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  /** 識別キー(例: `contact:${ip}`) */
  key: string;
  /** ウィンドウ内の最大リクエスト数 */
  limit: number;
  /** ウィンドウ長(ミリ秒) */
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  /** 制限超過時、次に試行可能になるまでの秒数 */
  retryAfterSeconds: number;
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: NextRequest): string {
  // Vercel等のリバースプロキシ経由ではx-forwarded-forの先頭が実クライアントIP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
