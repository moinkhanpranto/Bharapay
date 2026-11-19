import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { DisplayStatus } from '@/lib/utils/bill-status'
import { cn } from '@/lib/utils/cn'

const styles: Record<DisplayStatus, string> = {
  paid: 'bg-success-soft text-success',
  partial: 'bg-warning-soft text-warning',
  unpaid: 'bg-canvas text-ink-muted',
  overdue: 'bg-danger-soft text-danger',
}

export function StatusBadge({ status, t }: { status: DisplayStatus; t: Dictionary }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', styles[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {t.bills.status[status]}
    </span>
  )
}

export function Pill({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'brand' | 'success' | 'violet' | 'danger' }) {
  const tones = {
    muted: 'bg-canvas text-ink-muted',
    brand: 'bg-brand-soft text-brand-strong',
    success: 'bg-success-soft text-success',
    violet: 'bg-violet-soft text-violet',
    danger: 'bg-danger-soft text-danger',
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}
