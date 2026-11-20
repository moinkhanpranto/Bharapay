import Image from 'next/image'

/**
 * Official BharaPay logo, exported from the Figma file
 * (page "Logo & Branding": Logo.Icon / Logo With Text).
 * Source files live in /public/brand — replace them there if the logo changes.
 *
 *   <Logo />                  full wordmark, dark text (light backgrounds)
 *   <Logo variant="white" />  full wordmark, white text (blue/dark backgrounds)
 *   <LogoIcon size={48} />    house + check + ৳ mark only
 */

const WORDMARK_RATIO = 1112 / 213
const ICON_RATIO = 236 / 213

export function Logo({ height = 32, variant = 'default', className }: { height?: number; variant?: 'default' | 'white'; className?: string }) {
  return (
    <Image
      src={variant === 'white' ? '/brand/bharapay-logo-white.svg' : '/brand/bharapay-logo.svg'}
      alt="BharaPay"
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      priority
      unoptimized
      className={className}
    />
  )
}

export function LogoIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/bharapay-icon.svg"
      alt="BharaPay"
      width={Math.round(size * ICON_RATIO)}
      height={size}
      unoptimized
      className={className}
    />
  )
}
