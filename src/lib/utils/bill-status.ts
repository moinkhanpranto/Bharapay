import type { Enums } from '@/lib/supabase/database.types'
import { todayISO } from './format'

export type DisplayStatus = Enums<'bill_status'> | 'overdue'

/** "overdue" is not stored — it is an unpaid/partial bill past its due date. */
export function displayStatus(bill: { status: Enums<'bill_status'>; due_date: string }): DisplayStatus {
  if (bill.status !== 'paid' && bill.due_date < todayISO()) return 'overdue'
  return bill.status
}
