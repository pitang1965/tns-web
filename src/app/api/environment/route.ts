import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// NODE_ENV をそのまま返す。DB URI の内容を返すと DB 命名規則が漏洩するため変更。
export async function GET() {
  return NextResponse.json(
    {
      environment:
        process.env.NODE_ENV === 'development' ? 'development' : 'production',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
