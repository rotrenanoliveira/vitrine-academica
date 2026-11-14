'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { listActivePromotions } from '@/server/http/routes/points/list-active-promotions'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'
import type { ProjectListItem } from '@/utils/type'
import { promotedProjectsSearchParams, promotedProjectsUrlKeys } from '../search-params'
import { PromotedProjectsPagination } from './promoted-projects-pagination'

const PAGE_LIMIT = 12

function PromotedProjectsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
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
            <Skeleton className="mt-auto h-5 w-36 rounded-none bg-[#252422]/15" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function fetchPromotedProjectsPage(page: number) {
  const [{ items, total, page: currentPage, limit }, { tags }] = await Promise.all([
    listActivePromotions({ page, limit: PAGE_LIMIT }),
    fetchTags(),
  ])

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

  return { projects, tags, total, page: currentPage, limit }
}

export function PromotedProjectsGalleryList() {
  const [filters] = useQueryStates(promotedProjectsSearchParams, {
    urlKeys: promotedProjectsUrlKeys,
    shallow: true,
  })

  const page = filters.page > 0 ? filters.page : 1

  const { data, isPending, isError } = useQuery({
    queryKey: ['promotions', 'active', { page, limit: PAGE_LIMIT }],
    queryFn: () => fetchPromotedProjectsPage(page),
  })

  if (isPending) {
    return <PromotedProjectsSkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os projetos promovidos.</p>
  }

  if (data.projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto promovido no momento.</p>
  }

  const hasNextPage = data.page * data.limit < data.total

  return (
    <div className="flex flex-col gap-8">
      <ProjectGalleryCards
        projects={data.projects}
        tags={data.tags}
        title="Projetos promovidos"
        eyebrow={`galeria · ${String(data.total).padStart(2, '0')} projetos`}
        description="Pesquisas e narrativas em destaque no acervo, promovidas pela comunidade."
        ctaVariant="tile"
      />
      <PromotedProjectsPagination page={data.page} hasNextPage={hasNextPage} />
    </div>
  )
}
