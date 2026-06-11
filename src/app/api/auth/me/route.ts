import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { isAdmin } from '@/lib/userUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth0.getSession();
  return NextResponse.json({
    isAdmin: isAdmin(session?.user),
  });
}
