import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin camping spots management
  if (request.nextUrl.pathname.startsWith('/admin/camping-spots')) {
    // Check if user has Auth0 session cookie
    const sessionCookie = request.cookies.get('appSession');

    if (!sessionCookie) {
      // No session cookie, redirect to login
      const loginUrl = new URL('/api/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Let the page handle the detailed admin authorization
    // The session cookie exists, so we allow access to the page
    // The page will check ADMIN_EMAILS and show appropriate UI
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/camping-spots/:path*'],
};
