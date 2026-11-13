import Image from 'next/image'
import type { ReactNode } from 'react'

type ProjectCoverFrameProps = {
  coverUrl?: string | null
  alt: string
  tagLabel?: string | null
  priority?: boolean
  children?: ReactNode
}

export function ProjectCoverFrame({ coverUrl, alt, tagLabel, priority = false, children }: ProjectCoverFrameProps) {
  return (
    <div className="border border-[#252422]/35 bg-[#e6e0d7] p-2 shadow-[10px_10px_0_rgba(37,36,34,0.10)] sm:p-3">
      <div className="relative aspect-video overflow-hidden bg-[#c6c0b8]">
        {children ??
          (coverUrl ? (
            <Image src={coverUrl} alt={alt} fill unoptimized className="object-cover" priority={priority} />
          ) : (
            <div className="size-full bg-[#c6c0b8]" aria-hidden />
          ))}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/10" />
        {tagLabel ? (
          <span className="absolute left-4 top-4 bg-[#f4f1eb]/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em]">
            {tagLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
