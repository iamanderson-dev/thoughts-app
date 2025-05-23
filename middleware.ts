import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Public routes that don't require auth
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/auth/callback',
    '/_next/static',
    '/_next/image',
    '/favicon.ico'
  ]

  // Skip middleware for public routes
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return response
  }

  // Check for active session
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}