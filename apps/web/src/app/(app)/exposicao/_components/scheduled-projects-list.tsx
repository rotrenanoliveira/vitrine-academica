'use client'

import { useQuery } from '@tanstack/react-query'

import { ProjectGallerySlide } from '@/components/project/project-gallery-slide'
import { ProjectGallerySlideSkeleton } from '@/components/project/project-gallery-slide-skeleton'
import { fetchScheduledProjectsWithCover } from '@/server/http/routes/projects/fetch-scheduled-projects'
import { formatBrasiliaDateTime } from '@/utils/date-time'

export function ScheduledProjectsList() {
  const {
    data: scheduledProjects = [],
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

  if (scheduledProjects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento agendado para os próximos 7 dias.</p>
  }

  const captionByProjectId = Object.fromEntries(
    scheduledProjects.map(({ project, publishedIn }) => [
      project.id,
      `Lançamento em ${formatBrasiliaDateTime(publishedIn)}`,
    ]),
  )

  return (
    <ProjectGallerySlide
      projects={scheduledProjects.map(({ project }) => project)}
      captionByProjectId={captionByProjectId}
    />
  )
}
