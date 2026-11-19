import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js 16 "Proxy" (formerly Middleware). Keeps the Supabase session fresh
 * and redirects signed-out users away from private pages.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Skip static files, images and the PWA assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
