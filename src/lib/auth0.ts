import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';
import { getPrimaryAppBaseUrl } from '@/lib/appBaseUrl';

export const auth0 = new Auth0Client({
  async onCallback(error, context) {
    // SDK がリクエストから解決した URL を優先する（APP_BASE_URL が複数指定のとき、
    // 環境変数をそのまま new URL に渡すと Invalid URL になる）。
    // state 不一致などのエラー経路では context が空なので、先頭の値に戻す。
    const baseUrl = context.appBaseUrl ?? getPrimaryAppBaseUrl();
    if (error) {
      // 開発中に原因を追えるようログを残す
      console.error('Auth0 Callback Error:', error);
      // エラー時は安全にトップへ戻す
      return NextResponse.redirect(new URL('/', baseUrl));
    }
    return NextResponse.redirect(new URL(context.returnTo || '/', baseUrl));
  },
});
