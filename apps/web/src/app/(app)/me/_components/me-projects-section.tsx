'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { ProjectGalleryCard } from '@/components/project/project-gallery-card'
import { fetchMyProjectsGallery } from '../_lib/fetch-my-projects-gallery'

const PREVIEW_LIMIT = 3

export function MeProjectsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'projects'],
    queryFn: fetchMyProjectsGallery,
  })

  if (isPending) {
    return (
      <MeSection
        id="me-projetos"
        eyebrow="projetos"
        title="Meus projetos"
        href="/me/projetos"
        linkLabel="Ver todos os meus projetos"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-projetos"
        eyebrow="projetos"
        title="Meus projetos"
        href="/me/projetos"
        linkLabel="Ver todos os meus projetos"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar os seus projetos.</p>
      </MeSection>
    )
  }

  const preview = data.projects.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-projetos"
      eyebrow={`projetos · ${String(data.projects.length).padStart(2, '0')}`}
      title="Meus projetos"
      href="/me/projetos"
      linkLabel="Ver todos os meus projetos"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não tem projetos."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((project) => (
          <ProjectGalleryCard key={project.id} project={project} tags={data.tags} />
        ))}
      </div>
    </MeSection>
  )
}
