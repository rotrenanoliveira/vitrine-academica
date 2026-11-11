'use client'

import { ArrowUpRight01Icon, ChevronLeftIcon, ChevronRightIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Project, Tag } from '@/utils/type'
import { resolveProjectTagNames } from './project-gallery-utils'

const AUTO_ADVANCE_MS = 15_000

type ProjectWithCover = Project & { coverUrl: string | null }

type ProjectGallerySlideProps = {
  projects: ProjectWithCover[]
  tags?: Tag[]
}

export function ProjectGallerySlide({ projects, tags = [] }: ProjectGallerySlideProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = projects.length

  // biome-ignore lint/correctness/useExhaustiveDependencies: Restarts the timer when the active index changes
  useEffect(() => {
    if (total <= 1) return

    const timerId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total)
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(timerId)
  }, [total, activeIndex])

  if (projects.length === 0) {
    return null
  }

  const project = projects[activeIndex] ?? projects[0]
  const tagNames = resolveProjectTagNames(project, tags)

  const projectHref = `/projetos/${project.id}`

  function goTo(index: number) {
    setActiveIndex((index + total) % total)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="relative">
        <div className="border border-[#252422]/35 bg-[#e6e0d7] p-2 shadow-[10px_10px_0_rgba(37,36,34,0.10)] sm:p-3">
          <div className="relative aspect-video overflow-hidden bg-[#c6c0b8]">
            {projects.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ${
                  index === activeIndex ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                }`}
                aria-hidden={index !== activeIndex}
              >
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt={`Capa de ${item.title}`}
                    fill
                    unoptimized
                    className="object-cover"
                    priority={index === 0}
                  />
                ) : (
                  <div className="size-full bg-[#c6c0b8]" aria-hidden />
                )}
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/10" />
            {tagNames[0] ? (
              <span className="absolute left-4 top-4 bg-[#f4f1eb]/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em]">
                {tagNames[0]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-[#252422]/55">
          <span>
            Projeto {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="flex flex-wrap justify-end gap-x-2 gap-y-1">
            <span className="sm:hidden">{tagNames[0]}</span>
            <span className="hidden sm:inline">{tagNames.slice(0, 3).join(' · ')}</span>
          </div>
        </div>

        <div className="mt-5 flex items-stretch gap-3 sm:gap-4">
          <Card className="min-w-0 flex-1 rounded-none bg-[#ebe6de] shadow-none">
            <CardContent className="flex flex-col justify-center gap-2">
              <h2 className="font-semibold truncate text-2xl leading-tight tracking-[-0.03em] sm:text-3xl">
                {project.title}
              </h2>
              <p className="line-clamp-2 text-sm leading-6 text-[#252422]/70">{project.description}</p>
            </CardContent>
          </Card>

          <Button
            nativeButton={false}
            size="icon"
            className="group size-14 shrink-0 self-stretch rounded-none bg-[#252422] text-[#f4f1eb] shadow-none transition-[background-color,box-shadow] duration-200 hover:bg-[#252422]/85 hover:shadow-[6px_6px_0_rgba(37,36,34,0.18)] sm:w-16"
            render={<Link href={projectHref} />}
            aria-label={`Visualizar o projeto ${project.title}`}
          >
            <span className="sr-only">Mais detalhes sobre o projeto</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              className="size-5 transition-transform duration-200 group-hover:scale-125"
            />
          </Button>
        </div>
      </div>

      {total > 1 ? (
        <nav
          className="flex items-center justify-end gap-3 border-t border-[#252422]/20 pt-10"
          aria-label="Controles da galeria"
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-[#252422]/30 bg-transparent"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Projeto anterior"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} className="size-5" />
          </Button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Selecionar projeto">
            {projects.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Ir para ${item.title}`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-10 bg-[#252422]' : 'w-2 bg-[#252422]/25 hover:bg-[#252422]/50'
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-[#252422]/30 bg-transparent"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Próximo projeto"
          >
            <HugeiconsIcon icon={ChevronRightIcon} className="size-5" />
          </Button>
        </nav>
      ) : null}
    </div>
  )
}
