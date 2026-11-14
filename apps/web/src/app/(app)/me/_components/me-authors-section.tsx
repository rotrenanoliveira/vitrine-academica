'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { AuthorSubscriptionsGrid } from '@/components/newsletter/author-subscriptions-grid'
import { listMySubscriptions } from '@/server/http/routes/newsletter/list-my-subscriptions'

const PREVIEW_LIMIT = 3

export function MeAuthorsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'subscriptions', { status: 'ACTIVE' }],
    queryFn: () => listMySubscriptions({ status: 'ACTIVE' }),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-autores"
        eyebrow="autores"
        title="Autores que acompanho"
        href="/me/autores"
        linkLabel="Ver todos os autores acompanhados"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-autores"
        eyebrow="autores"
        title="Autores que acompanho"
        href="/me/autores"
        linkLabel="Ver todos os autores acompanhados"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar os autores que você acompanha.</p>
      </MeSection>
    )
  }

  const subscriptions = data.subscriptions
  const preview = subscriptions.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-autores"
      eyebrow={`autores · ${String(subscriptions.length).padStart(2, '0')}`}
      title="Autores que acompanho"
      href="/me/autores"
      linkLabel="Ver todos os autores acompanhados"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não acompanha nenhum autor."
    >
      <AuthorSubscriptionsGrid subscriptions={preview} />
    </MeSection>
  )
}
