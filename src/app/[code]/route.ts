import { NextRequest, NextResponse } from 'next/server';
import { ensureDbConnection } from '@/lib/database';
import ShortLink from '@/lib/models/ShortLink';

export const dynamic = 'force-dynamic';

const SHORT_LINK_HOST = 's.nafuda.me';

/**
 * 短縮URL(s.nafuda.me/<code>)専用のリダイレクトハンドラー。
 * メインドメイン(tabi.over40web.club等)では発火させない。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const host = request.headers.get('host');
  if (host !== SHORT_LINK_HOST) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { code } = await params;

  await ensureDbConnection();
  const link = await ShortLink.findOne({ code });

  if (!link) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.redirect(link.targetUrl, { status: 302 });
}
