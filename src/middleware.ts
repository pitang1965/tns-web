import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
  const authRes = await auth0.middleware(request);

  // Ensure your own middleware does not handle the `/auth` routes, auto-mounted and handled by the SDK
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return authRes;
  }

  // Custom logic for admin routes
  if (request.nextUrl.pathname.startsWith('/admin/camping-spots')) {
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
