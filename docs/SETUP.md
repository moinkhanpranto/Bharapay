# Setup (one-time)

Supabase project: `dfvmbsiscmzftppvfmyz` (BharaPay). The database migrations
are already applied.

## 1. Secret key (needed for online payments)

Supabase dashboard → **Project Settings → API Keys** → copy the **secret key**
(`sb_secret_…`) into `.env.local` as `SUPABASE_SECRET_KEY` and into Vercel
(Production + Preview). Never put it in a `NEXT_PUBLIC_` variable.

## 2. Email one-time code (OTP)

By default Supabase emails a magic **link**. BharaPay asks for a 6-digit **code**.

Dashboard → **Authentication → Emails → Templates**. In both **Magic Link**
and **Confirm signup**, put the code in the email, for example:

```html
<h2>BharaPay</h2>
<p>আপনার লগইন কোড / Your login code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>কোডটি ১০ মিনিট পর্যন্ত কাজ করবে। কাউকে এই কোড দেবেন না।</p>
```

Then **Authentication → Providers → Email**: keep it enabled; set
"Email OTP Expiration" to 600 seconds and "Email OTP Length" to 6.

For real users, set up custom SMTP (Authentication → Emails → SMTP), e.g.
Resend or Amazon SES. Supabase's built-in mailer only sends a few emails per
hour and is for testing.

## 3. Google sign-in

1. Google Cloud Console → APIs & Services → **OAuth consent screen** (External,
   app name BharaPay, your support email).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   Authorised redirect URI:
   `https://dfvmbsiscmzftppvfmyz.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Providers → Google**: enable, paste the
   Client ID and Client Secret.

## 4. Redirect URLs

Supabase → **Authentication → URL Configuration**:

- Site URL: your production URL (e.g. `https://bharapay.vercel.app`)
- Redirect URLs: `http://localhost:3000/**`, `https://bharapay.vercel.app/**`,
  `https://*-<your-vercel-team>.vercel.app/**` (previews)

## 5. Vercel

Import the GitHub repo in Vercel, framework Next.js, and add every variable
from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL).

## 6. Install on a phone (PWA)

- Android (Chrome): open the site → Account → "Install app", or menu → Install.
- iPhone (Safari): Share → Add to Home Screen.
