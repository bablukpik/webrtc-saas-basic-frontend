import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { publicRoutes } from './utils/auth';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (!isPublicRoute && !accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
