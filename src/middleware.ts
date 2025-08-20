import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = ['/dashboard'];
const publicPaths = ['/auth', '/api/auth', '/', '/register', '/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log('Middleware running for path:', pathname);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Skip middleware for NextAuth API routes specifically
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip middleware for other public paths (but be more specific)
  const isPublicPath = publicPaths.some((path) => {
    if (path === '/') {
      return pathname === '/'; // Exact match for home page
    }
    return pathname.startsWith(path);
  });

  if (isPublicPath) {
    console.log('Public path, allowing access:', pathname);
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token'
      });

      console.log('Token found:', !!token, token?.email);

      if (!token) {
        console.log('No token found, redirecting to login');
        const loginUrl = new URL('/auth/login', req.url);
        return NextResponse.redirect(loginUrl);
      }

      console.log('Token valid, allowing access to protected route');
    } catch (error) {
      console.error('Error getting token:', error);
      const loginUrl = new URL('/auth/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continue with the request
  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
}

export const config = {
  matcher: [
    /*
     * Match only protected routes and exclude static files
     */
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};