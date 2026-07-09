import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function proxy(request: NextRequest) {
  // /api/v1/* (モバイルアプリが利用する公開契約) を固定APIキーで保護する。
  //
  // ルート関数内でなくここで検証する理由: /api/v1/spots は Cache-Control:
  // s-maxage でVercel CDNにキャッシュされ、キャッシュHIT時はルート関数が
  // 実行されない。プロキシはキャッシュより前段で毎回走るため、キャッシュ済み
  // レスポンスもキー無しには返さない。
  //
  // fail-closed: サーバーに SPOTS_API_KEY 未設定でも401(設定漏れで保護が
  // 静かに無効化されるのを防ぐ)。各環境の環境変数に設定が必須。
  //
  // 注意: 埋め込みキーはアプリバイナリから抽出可能なため、本物の認証ではなく
  // 匿名・野良アクセスを弾くための段差(speed bump)。
  //
  // レート制限は設けていない: /api/v1/spots は単一URLで全件を1レスポンスで
  // 返す全量ダンプのため、1リクエストで全データが入手できる。リクエスト数を
  // 絞っても流出は防げず効果がない。DBやコストへの負荷は上記CDNキャッシュで
  // 緩和済み。将来「1件取得」「検索」等の細粒度エンドポイントを追加した際は
  // レート制限の導入を再検討すること。
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const expected = process.env.SPOTS_API_KEY;

    if (!expected || request.headers.get('x-api-key') !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  const authRes = await auth0.middleware(request);

  // Ensure your own middleware does not handle the `/auth` routes, auto-mounted and handled by the SDK
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return authRes;
  }

  // Custom logic for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth0.getSession(request);

    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If a valid session exists, continue with the response from Auth0 middleware
  return authRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     *
     * ただし /api/v1 配下だけはAPIキー検証のためマッチさせる
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/api/v1/:path*',
  ],
};
