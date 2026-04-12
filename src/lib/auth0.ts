import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';

export const auth0 = new Auth0Client({
  async onCallback(error, context) {
    const baseUrl = process.env.APP_BASE_URL ?? '';
    if (error) {
      // 開発中に原因を追えるようログを残す
      console.error('Auth0 Callback Error:', error);
      // エラー時は安全にトップへ戻す
      return NextResponse.redirect(new URL('/', baseUrl));
    }
    return NextResponse.redirect(new URL(context.returnTo || '/', baseUrl));
  },
});
