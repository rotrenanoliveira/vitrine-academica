'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { fetchMyProjectsGallery } from '../../_lib/fetch-my-projects-gallery'

export function MeProjectsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'projects'],
    queryFn: fetchMyProjectsGallery,
  })

  if (isPending) {
    return <MeCardsSkeleton count={6} />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os seus projetos.</p>
  }

  if (data.projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Você ainda não tem projetos.</p>
  }

  return (
    <ProjectGalleryCards
      projects={data.projects}
      tags={data.tags}
      title="Meus projetos"
      eyebrow={`galeria · ${String(data.projects.length).padStart(2, '0')} projetos`}
      description="Autorias e coautorias com convite aceito."
    />
  )
}
