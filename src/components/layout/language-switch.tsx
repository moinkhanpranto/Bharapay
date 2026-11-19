import { setLocale } from '@/features/account/actions'
import type { Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils/cn'

/** বাংলা / English toggle. Plain form posts → works without JavaScript too. */
export function LanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <form action={setLocale} className="inline-flex rounded-xl border border-line bg-surface p-1 text-sm">
      {(
        [
          ['bn', 'বাংলা'],
          ['en', 'English'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          name="locale"
          value={value}
          aria-pressed={locale === value}
          className={cn('h-9 rounded-lg px-3 font-medium', locale === value ? 'bg-brand text-white' : 'text-ink-muted')}
        >
          {label}
        </button>
      ))}
    </form>
  )
}
