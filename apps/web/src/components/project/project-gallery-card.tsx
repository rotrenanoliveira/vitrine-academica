import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Project, Tag } from '@/utils/type'
import { resolveProjectTagNames } from './project-gallery-utils'

type ProjectWithCover = Project & { coverUrl: string | null }

type ProjectGalleryCardProps = {
  project: ProjectWithCover
  tags?: Tag[]
}

export function ProjectGalleryCard({ project, tags = [] }: ProjectGalleryCardProps) {
  const projectHref = `/projetos/${project.id}`
  const tagNames = resolveProjectTagNames(project, tags)

  return (
    <Card className="group gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <div className="p-2">
        <div className="border border-[#252422]/30 bg-[#e6e0d7] p-2 shadow-[5px_5px_0_rgba(37,36,34,0.08)]">
          <Link
            href={projectHref}
            className="relative block aspect-4/3 overflow-hidden border border-[#252422]/15 bg-[#c6c0b8]"
          >
            {project.coverUrl ? (
              <Image
                src={project.coverUrl}
                alt={`Capa de ${project.title}`}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="size-full bg-[#c6c0b8]" aria-hidden />
            )}
            {tagNames[0] ? (
              <span className="absolute left-3 top-3 bg-[#f4f1eb]/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">
                {tagNames[0]}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      <CardContent className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
          <span>{tagNames[0]}</span>
        </p>
        <h3 className="font-semibold text-xl leading-tight tracking-[-0.03em]">
          <Link href={projectHref} className="hover:underline">
            {project.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#252422]/65">{project.description}</p>
        <Button
          variant="link"
          nativeButton={false}
          className="mt-auto h-auto justify-between p-0 pt-5 group text-[#252422] no-underline hover:no-underline"
          render={<Link href={projectHref} />}
          aria-label={`Visualizar o projeto ${project.title}`}
        >
          <span className="group-hover:underline">Visualizar projeto</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" className="size-5" />
        </Button>
      </CardContent>
    </Card>
  )
}
