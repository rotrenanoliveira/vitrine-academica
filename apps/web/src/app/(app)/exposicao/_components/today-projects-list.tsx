'use client'

import { useQuery } from '@tanstack/react-query'

import { ProjectGalleryCard } from '@/components/project/project-gallery-card'
import { fetchPublishedProjectsTodayWithCover } from '@/server/http/routes/projects/fetch-published-projects-today'

export function TodayProjectsList() {
  const {
    data: projects = [],
    isPending: isProjectsPending,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projects', { status: 'PUBLISHED', scope: 'today' }],
    queryFn: fetchPublishedProjectsTodayWithCover,
  })

  if (isProjectsPending) {
    return <p className="text-sm text-muted-foreground">Carregando projetos…</p>
  }

  if (isProjectsError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os projetos.</p>
  }

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto lançado hoje.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-8">
      {projects.map((project, index) => (
        <div key={project.id} className={index % 2 === 1 ? 'md:mt-16' : undefined}>
          <ProjectGalleryCard project={project} />
        </div>
      ))}
    </div>
  )
}
