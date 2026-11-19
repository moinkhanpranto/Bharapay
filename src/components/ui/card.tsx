import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-[var(--radius-card)] border border-line bg-surface p-5', className)} {...props} />
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{children}</h2>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {body && <p className="max-w-sm text-ink-muted">{body}</p>}
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: ReactNode; back?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function FormMessage({ state }: { state: { ok: boolean; message?: string; error?: string } | null }) {
  if (!state) return null
  if (state.ok && state.message)
    return (
      <p role="status" className="rounded-2xl bg-success-soft px-4 py-3 text-sm text-success">
        {state.message}
      </p>
    )
  if (!state.ok && state.error)
    return (
      <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
        {state.error}
      </p>
    )
  return null
}
