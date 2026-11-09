import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  href?: string | null
  className?: string
  imgClassName?: string
  priority?: boolean
  showText?: boolean
  textClassName?: string
  subtitle?: string
}

export function BrandLogo({
  href = '/',
  className,
  imgClassName,
  priority = false,
  showText = false,
  textClassName,
  subtitle,
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/images/vspark.png"
        alt="COMSATS VSpark Quiz Competition"
        width={328}
        height={160}
        priority={priority}
        className={cn('h-9 w-auto object-contain', imgClassName)}
      />
      {showText && (
        <span className={cn('flex flex-col', textClassName)}>
          <span className="font-display text-base font-extrabold tracking-wide text-slate-900">
            COMSATS <span className="text-gradient">VSPARK</span>
          </span>
          {subtitle && (
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 -mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </>
  )

  if (href === null) {
    return <div className={cn('flex items-center gap-2.5', className)}>{content}</div>
  }

  return (
    <Link href={href} className={cn('flex items-center gap-2.5 group shrink-0', className)} aria-label="COMSATS VSpark Quiz Competition — Home">
      {content}
    </Link>
  )
}