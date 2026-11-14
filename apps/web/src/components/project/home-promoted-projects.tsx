'use client'

import { useQuery } from '@tanstack/react-query'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { ProjectGalleryTileLink } from '@/components/project/project-gallery-tile-link'
import { Skeleton } from '@/components/ui/skeleton'
import { listActivePromotions } from '@/server/http/routes/points/list-active-promotions'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'
import type { ProjectListItem } from '@/utils/type'

async function fetchHomePromotedProjects() {
  const [{ items, total }, { tags }] = await Promise.all([listActivePromotions({ page: 1, limit: 3 }), fetchTags()])

  const projects: ProjectListItem[] = await Promise.all(
    items.map(async ({ project }) => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      coverUrl: await resolveProjectCoverUrl(project),
      createdAt: project.createdAt,
      tags: project.tags,
    })),
  )

  return { projects, tags, total }
}

function HomePromotedProjectsSkeleton() {
  return (
    <section className="space-y-7" aria-busy="true">
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40 rounded-none bg-[#252422]/15" />
          <Skeleton className="h-12 w-64 rounded-none bg-[#252422]/15" />
        </div>
        <Skeleton className="size-12 rounded-none bg-[#252422]/15" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="overflow-hidden bg-transparent p-0">
            <div className="p-2">
              <div className="border border-[#252422]/30 bg-[#e6e0d7] p-2 shadow-[5px_5px_0_rgba(37,36,34,0.08)]">
                <Skeleton className="relative aspect-4/3 rounded-none bg-[#c6c0b8]" />
              </div>
            </div>
            <div className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
              <Skeleton className="mb-3 h-3 w-20 rounded-none bg-[#252422]/15" />
              <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
              <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-auto h-10 w-10 rounded-none bg-[#252422]/15" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HomePromotedProjects() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['promotions', 'active', { page: 1, limit: 3 }],
    queryFn: fetchHomePromotedProjects,
  })

  if (isPending) {
    return <HomePromotedProjectsSkeleton />
  }

  if (isError || !data || data.projects.length === 0) {
    return null
  }

  return (
    <ProjectGalleryCards
      projects={data.projects}
      tags={data.tags}
      title="Em destaque"
      eyebrow={`promovidos · ${String(data.total).padStart(2, '0')} projetos`}
      ctaVariant="tile"
      headerAction={
        <ProjectGalleryTileLink href="/projetos/promovidos" label="Ver todos os projetos promovidos" size="md" />
      }
    />
  )
}
