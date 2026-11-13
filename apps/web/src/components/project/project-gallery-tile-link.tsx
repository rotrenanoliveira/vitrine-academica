import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ProjectGalleryTileLinkProps = {
  href: string
  label: string
  className?: string
  size?: 'sm' | 'md'
}

export function ProjectGalleryTileLink({ href, label, className, size = 'md' }: ProjectGalleryTileLinkProps) {
  const boxSize = size === 'sm' ? 'size-10' : 'size-12'
  const iconSize = size === 'sm' ? 'size-5' : 'size-6'

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'group/tile inline-flex shrink-0 items-center justify-center bg-[#252422] text-[#f4f1eb] shadow-none transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#252422]/85 hover:shadow-[6px_6px_0_rgba(37,36,34,0.18)]',
        boxSize,
        className,
      )}
    >
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        className={cn(iconSize, 'transition-transform duration-200 group-hover/tile:scale-125')}
      />
    </Link>
  )
}
