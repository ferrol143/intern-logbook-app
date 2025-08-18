import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 200 });
    addCORSHeaders(preflight);
    return preflight;
  }

  // ✅ 2. Check if route is protected
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected) {
    // Check for NextAuth cookies (dev + prod)
    // const token = req.cookies.get('next-auth.session-token')?.value;
    // if(!token){
    //   // If no token, redirect to login
    //   const loginUrl = new URL('/auth/login', req.url);
    //   return NextResponse.redirect(loginUrl);
    // }
  }

  // ✅ 3. Continue request and add headers
  const response = NextResponse.next();
  addCORSHeaders(response);
  addSecurityHeaders(response);
  return response;
}

// ✅ Helper: Add CORS headers
function addCORSHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ✅ Helper: Add security headers
function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ],
};