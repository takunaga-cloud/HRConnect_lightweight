import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from './lib/constants'

export function middleware(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const { pathname } = request.nextUrl

    // Public paths that don't satisfy the protection check
    const isUnprotectedPath = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.includes('.');

    // Force logout on root path
    if (pathname === '/') {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0 })
        return response
    }

    // Token-based Protection
    if (!token && !isUnprotectedPath && !pathname.startsWith('/api/')) {
        // Redirect to login if accessing protected route without token
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token && pathname === '/login') {
        // Redirect to dashboard if accessing login with token
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export default middleware;

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Note: Included 'api' to allow header injection, but excluded internal auth api? No, middleware runs on all.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
