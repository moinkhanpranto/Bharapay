'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Re-checks the payment status every 2 s (max ~1 min) while the webhook is on its way. */
export function AutoRefresh() {
  const router = useRouter()
  useEffect(() => {
    let count = 0
    const timer = setInterval(() => {
      count += 1
      if (count > 30) clearInterval(timer)
      router.refresh()
    }, 2000)
    return () => clearInterval(timer)
  }, [router])
  return <span className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
}
