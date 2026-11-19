import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { format, type Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { displayStatus } from '@/lib/utils/bill-status'
import { formatDate, formatTaka } from '@/lib/utils/format'
import type { Enums } from '@/lib/supabase/database.types'

export type BillListItem = {
  id: string
  due_date: string
  amount_due: number
  amount_paid: number
  status: Enums<'bill_status'>
  tenants: { full_name: string; units: { label: string; properties: { name: string } | null } | null } | null
}

/** One line in a bill list: who, which flat, how much is left, status. */
export function BillRow({ bill, t, locale, showTenant = true }: { bill: BillListItem; t: Dictionary; locale: Locale; showTenant?: boolean }) {
  const left = Number(bill.amount_due) - Number(bill.amount_paid)
  const unit = bill.tenants?.units
  return (
    <li>
      <Link href={`/bills/${bill.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-canvas">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
          {(bill.tenants?.full_name ?? '?').slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{showTenant ? bill.tenants?.full_name : unit?.properties?.name}</span>
          <span className="block truncate text-sm text-ink-muted">
            {unit?.properties?.name} · {unit?.label} · {format(t.bills.due, { date: formatDate(bill.due_date, locale) })}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="font-semibold">{formatTaka(left > 0 ? left : bill.amount_due, locale)}</span>
          <StatusBadge status={displayStatus(bill)} t={t} />
        </span>
      </Link>
    </li>
  )
}
