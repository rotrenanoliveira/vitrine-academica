'use client'

import { useQuery } from '@tanstack/react-query'
import { ProjectGallery } from '@/components/project/project-gallery'
import { ProjectGallerySlideSkeleton } from '@/components/project/project-gallery-slide-skeleton'
import { fetchPublishedProjectsWithCover } from '@/server/http/routes/projects/fetch-published-projects'

export function HomeProjectsGallery() {
  const {
    data: projects = [],
    isPending: isProjectsPending,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projects', { status: 'PUBLISHED', scope: 'user' }],
    queryFn: fetchPublishedProjectsWithCover,
  })

  if (isProjectsPending) {
    return (
      <section className="bg-[#f4f1eb] px-5 py-8 text-[#252422] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <ProjectGallerySlideSkeleton />
        </div>
      </section>
    )
  }

  if (isProjectsError) {
    return (
      <p className="px-5 text-center text-sm text-muted-foreground sm:px-8 lg:px-16">
        Não foi possível carregar os projetos.
      </p>
    )
  }

  return <ProjectGallery projects={projects} featuredCount={5} />
}
