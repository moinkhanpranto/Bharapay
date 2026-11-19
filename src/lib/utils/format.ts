import type { Locale } from '@/lib/i18n/config'

const numberLocale = (locale: Locale) => (locale === 'bn' ? 'bn-BD' : 'en-IN')

/**
 * Taka with South-Asian grouping: 345000 → "৳3,45,000" (en) / "৳৩,৪৫,০০০" (bn).
 * Paisa is shown only when it is not zero.
 */
export function formatTaka(amount: number | string, locale: Locale = 'bn') {
  const value = typeof amount === 'string' ? Number(amount) : amount
  const hasPaisa = Math.round(value * 100) % 100 !== 0
  const number = new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)
  return `৳${number}`
}

/** "2026-11-05" → "5 Nov 2026" / "৫ নভেম্বর, ২০২৬" */
export function formatDate(isoDate: string, locale: Locale = 'bn') {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat(numberLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

/** "2026-11-01" → "November 2026" / "নভেম্বর ২০২৬" */
export function formatMonth(isoDate: string, locale: Locale = 'bn') {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat(numberLocale(locale), { month: 'long', year: 'numeric' }).format(date)
}

export function formatNumber(value: number, locale: Locale = 'bn') {
  return new Intl.NumberFormat(numberLocale(locale)).format(value)
}

/** First day of the month for a date, as "YYYY-MM-01" (Dhaka time). */
export function monthStart(date: Date = new Date()) {
  const dhaka = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  const y = dhaka.getFullYear()
  const m = String(dhaka.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/** Today in Dhaka as "YYYY-MM-DD". */
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())
}

/** Shift a "YYYY-MM-01" month by n months. */
export function addMonths(isoMonth: string, n: number) {
  const [y, m] = isoMonth.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}
