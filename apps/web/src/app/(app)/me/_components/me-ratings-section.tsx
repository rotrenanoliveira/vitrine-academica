'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { RatingPreviewCard } from '@/components/project/rating-preview-card'
import { listMyTeacherRatings } from '@/server/http/routes/projects/list-my-teacher-ratings'

const PREVIEW_LIMIT = 3

export function MeRatingsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'teacher-ratings'],
    queryFn: () => listMyTeacherRatings(),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-avaliacoes"
        eyebrow="avaliações"
        title="Projetos que avaliei"
        href="/me/avaliacoes"
        linkLabel="Ver todas as avaliações"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-avaliacoes"
        eyebrow="avaliações"
        title="Projetos que avaliei"
        href="/me/avaliacoes"
        linkLabel="Ver todas as avaliações"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar as avaliações.</p>
      </MeSection>
    )
  }

  const preview = data.items.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-avaliacoes"
      eyebrow={`avaliações · ${String(data.items.length).padStart(2, '0')}`}
      title="Projetos que avaliei"
      href="/me/avaliacoes"
      linkLabel="Ver todas as avaliações"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não avaliou nenhum projeto."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((item) => (
          <RatingPreviewCard key={item.rating.id} item={item} />
        ))}
      </div>
    </MeSection>
  )
}
