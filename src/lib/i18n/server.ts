import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import { dictionaries } from './dictionaries'

/** Current UI language, from the `bp_locale` cookie (Bangla by default). */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
})

/** Dictionary for Server Components: `const t = await getT(); t.nav.home` */
export async function getT() {
  return dictionaries[await getLocale()]
}
