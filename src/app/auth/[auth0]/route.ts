import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: route } = await params;

  try {
    switch (route) {
      case 'login':
        return await auth0.handleLogin(req);
      case 'logout':
        return await auth0.handleLogout(req);
      case 'callback':
        return await auth0.handleCallback(req);
      case 'profile':
      case 'me':
        const session = await auth0.getSession();
        if (!session) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        return NextResponse.json(session.user);
      case 'access-token':
        const tokenSession = await auth0.getSession();
        if (!tokenSession) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const accessToken = await auth0.getAccessToken();
        return NextResponse.json(accessToken);
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Auth0 route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
