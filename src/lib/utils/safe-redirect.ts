/**
 * Only allow same-site relative paths after login, so `?next=` can't be used
 * to bounce users to another website (open-redirect protection).
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
