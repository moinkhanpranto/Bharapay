import Link from 'next/link'
import { ChevronLeftIcon } from '@/components/ui/icons'

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="no-print mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
      <ChevronLeftIcon width={18} height={18} /> {label}
    </Link>
  )
}
