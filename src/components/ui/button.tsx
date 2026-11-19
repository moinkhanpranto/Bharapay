import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tenant'
type Size = 'md' | 'lg' | 'sm'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong',
  tenant: 'bg-tenant text-white hover:brightness-95',
  secondary: 'bg-brand-soft text-brand-strong hover:bg-[#d6ebff]',
  ghost: 'bg-transparent text-ink hover:bg-canvas border border-line',
  danger: 'bg-danger-soft text-danger hover:bg-[#fbd9d5]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-12 px-5 text-base rounded-2xl',
  lg: 'h-14 px-6 text-lg rounded-2xl',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed select-none',
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
