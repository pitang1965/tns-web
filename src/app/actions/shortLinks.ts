'use server';

import { auth0 } from '@/lib/auth0';
import { ensureDbConnection } from '@/lib/database';
import ShortLink, { generateUniqueShortCode } from '@/lib/models/ShortLink';
import { logger } from '@/lib/logger';

const SHORT_LINK_HOST = 'https://s.nafuda.me';

/**
 * 短縮URL機能専用の管理者チェック。points.ts と同じく、このコードベースの
 * 慣習に合わせてファイルごとにローカルで持つ(共通化はしない)。
 */
async function requireAdminEmail(): Promise<string> {
  const session = await auth0.getSession();
  const email = session?.user?.email;
  if (!email) {
    throw new Error('認証されていません');
  }
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (!adminEmails.includes(email)) {
    throw new Error('管理者権限が必要です');
  }
  return email;
}

export type ShortLinkRow = {
  code: string;
  shortUrl: string;
  targetUrl: string;
  createdAt: string;
};

export async function getOrCreateShortLink(
  targetUrl: string,
): Promise<ShortLinkRow> {
  const email = await requireAdminEmail();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error('URLの形式が正しくありません');
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('httpsのURLのみ短縮できます');
  }

  await ensureDbConnection();

  const existing = await ShortLink.findOne({ targetUrl });
  if (existing) {
    return {
      code: existing.code,
      shortUrl: `${SHORT_LINK_HOST}/${existing.code}`,
      targetUrl: existing.targetUrl,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const code = await generateUniqueShortCode();

  try {
    const created = await ShortLink.create({
      code,
      targetUrl,
      createdBy: email,
    });
    return {
      code: created.code,
      shortUrl: `${SHORT_LINK_HOST}/${created.code}`,
      targetUrl: created.targetUrl,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    // 同時リクエストでunique制約に衝突した場合は、既存のものを取り直す
    const fallback = await ShortLink.findOne({ targetUrl });
    if (fallback) {
      return {
        code: fallback.code,
        shortUrl: `${SHORT_LINK_HOST}/${fallback.code}`,
        targetUrl: fallback.targetUrl,
        createdAt: fallback.createdAt.toISOString(),
      };
    }
    logger.error(
      error instanceof Error ? error : new Error('Failed to create ShortLink'),
    );
    throw new Error('短縮URLの発行に失敗しました');
  }
}

export async function listShortLinks(): Promise<ShortLinkRow[]> {
  await requireAdminEmail();
  await ensureDbConnection();

  const docs = await ShortLink.find().sort({ createdAt: -1 }).limit(100);
  return docs.map((doc) => ({
    code: doc.code,
    shortUrl: `${SHORT_LINK_HOST}/${doc.code}`,
    targetUrl: doc.targetUrl,
    createdAt: doc.createdAt.toISOString(),
  }));
}
