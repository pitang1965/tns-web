import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './src/lib/auth0';

export async function middleware(request: NextRequest) {
  // Auth0 middleware handles /auth/* routes automatically
  const auth0Response = await auth0.middleware(request);

  if (auth0Response) {
    return auth0Response;
  }

  // Custom logic for admin routes
  if (request.nextUrl.pathname.startsWith('/admin/camping-spots')) {
    const sessionCookie = request.cookies.get('appSession');

    if (!sessionCookie) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
