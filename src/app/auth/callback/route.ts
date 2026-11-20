import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/utils/safe-redirect'

const EMAIL_OTP_TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change']

/**
 * Finishes sign-in for every link-based flow:
 *  - Google OAuth and the default email "Sign in" link  → ?code=…   (PKCE)
 *  - a custom email template using {{ .TokenHash }}      → ?token_hash=…&type=email
 * On success: set the session cookie, link tenancies by email, continue to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()
  let ok = false

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error
  } else if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error
  }

  if (ok) {
    await supabase.rpc('claim_tenancies')
    const res = NextResponse.redirect(new URL(next, origin))
    res.cookies.delete('bp_otp_email')
    res.cookies.delete('bp_next')
    return res
  }

  // A PKCE link only works in the browser that asked for it (e.g. not inside
  // the Gmail app's own browser). Send the user back to enter the code instead.
  return NextResponse.redirect(new URL('/login?error=link', origin))
}
