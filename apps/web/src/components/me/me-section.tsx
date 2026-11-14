import type { ReactNode } from 'react'
import { ProjectGalleryTileLink } from '@/components/project/project-gallery-tile-link'

type MeSectionProps = {
  id: string
  eyebrow: string
  title: string
  href?: string
  linkLabel?: string
  children: ReactNode
  emptyMessage?: string
  isEmpty?: boolean
}

export function MeSection({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
  children,
  emptyMessage,
  isEmpty = false,
}: MeSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-7">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[#252422]/55">{eyebrow}</p>
          <h2 id={id} className="font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
            {title}
          </h2>
        </div>
        {href && linkLabel ? <ProjectGalleryTileLink href={href} label={linkLabel} size="md" /> : null}
      </div>

      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : children}
    </section>
  )
}
