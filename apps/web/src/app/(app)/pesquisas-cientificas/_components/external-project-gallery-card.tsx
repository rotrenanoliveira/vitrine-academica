import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ExternalProject } from '@/utils/type'

type ExternalProjectGalleryCardProps = {
  project: ExternalProject
}

export function ExternalProjectGalleryCard({ project }: ExternalProjectGalleryCardProps) {
  const authorsText = project.authors.join(', ')
  const bodyText = project.abstract?.trim() || authorsText || null

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
        <p className="mb-3 line-clamp-1 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
          {project.publishedIn || 'OpenAlex'}
        </p>
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em]">
          <a
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {project.title}
          </a>
        </h3>
        {bodyText ? (
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#252422]/65">{bodyText}</p>
        ) : null}
        <Button
          variant="link"
          nativeButton={false}
          className="mt-auto h-auto justify-between p-0 pt-5 group text-[#252422] no-underline hover:no-underline"
          render={
            <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" />
          }
          aria-label={`Abrir trabalho ${project.title}`}
        >
          <span className="group-hover:underline">Abrir trabalho</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" className="size-5" />
        </Button>
      </CardContent>
    </Card>
  )
}
