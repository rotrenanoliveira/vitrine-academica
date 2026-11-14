import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type ProjectReviewCardProps = {
  title: string
  description: string
  projectSlug: string | null
  meta?: ReactNode
  actions?: ReactNode
}

export function ProjectReviewCard({ title, description, projectSlug, meta, actions }: ProjectReviewCardProps) {
  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em]">{title}</h3>

        {meta ? <div className="mt-2 text-xs uppercase tracking-wide text-[#252422]/65">{meta}</div> : null}

        <div className="mt-3 text-sm leading-5 text-[#252422]/65">
          <p className="line-clamp-3">{description}</p>

          {projectSlug ? (
            <Link
              href={`/projetos/${projectSlug}`}
              className="mt-2 inline-block text-[#252422] underline-offset-2 hover:underline"
              target="_blank"
            >
              Ver projeto
            </Link>
          ) : null}
        </div>

        {actions ? <div className="mt-auto pt-5">{actions}</div> : <div className="mt-auto" />}
      </CardContent>
    </Card>
  )
}
