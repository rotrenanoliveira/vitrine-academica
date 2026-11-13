'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchProjects } from '@/server/http/routes/projects/fetch-projects'
import { projectsSearchParams, projectsUrlKeys } from '../search-params'

function ProjectsGallerySkeleton() {
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

export function ProjectsGalleryList() {
  const [filters] = useQueryStates(projectsSearchParams, {
    urlKeys: projectsUrlKeys,
    shallow: true,
  })

  const title = filters.title?.trim() || undefined
  const tags = filters.tags && filters.tags.length > 0 ? filters.tags : undefined

  const { data, isPending, isError } = useQuery({
    queryKey: ['projects', { scope: 'all', status: 'PUBLISHED', title, tags }],
    queryFn: () =>
      fetchProjects({
        scope: 'all',
        status: 'PUBLISHED',
        ...(title ? { title } : {}),
        ...(tags ? { tags } : {}),
      }),
  })

  if (isPending) {
    return <ProjectsGallerySkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os projetos.</p>
  }

  if (data.projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
  }

  return (
    <ProjectGalleryCards
      projects={data.projects}
      title="Sala de Exposição"
      description="Explore os projetos publicados no acervo."
    />
  )
}
