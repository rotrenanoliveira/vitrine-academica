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
    <Link href={href} aria-label={label} className={cn('group/tile relative inline-flex shrink-0', boxSize, className)}>
      <span className={cn('absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#c6c0b8]', boxSize)} aria-hidden />
      <span
        className={cn(
          'relative flex items-center justify-center bg-[#333333] text-[#f4f1eb] transition-colors duration-300 group-hover/tile:bg-[#2a2a2a]',
          boxSize,
        )}
      >
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          className={cn(
            iconSize,
            'transition-transform duration-300 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5',
          )}
        />
      </span>
    </Link>
  )
}
