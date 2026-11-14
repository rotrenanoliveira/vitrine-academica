'use client'

import { useQuery } from '@tanstack/react-query'

import { ProjectGallerySlide } from '@/components/project/project-gallery-slide'
import { ProjectGallerySlideSkeleton } from '@/components/project/project-gallery-slide-skeleton'
import { fetchScheduledProjectsWithCover } from '@/server/http/routes/projects/fetch-scheduled-projects'

export function ScheduledProjectsList() {
  const {
    data: projects = [],
    isPending: isProjectsPending,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projects', { status: 'SCHEDULED', scope: 'soon' }],
    queryFn: fetchScheduledProjectsWithCover,
  })

  if (isProjectsPending) {
    return <ProjectGallerySlideSkeleton />
  }

  if (isProjectsError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os lançamentos.</p>
  }

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento agendado para os próximos 7 dias.</p>
  }

  return <ProjectGallerySlide projects={projects} />
}
