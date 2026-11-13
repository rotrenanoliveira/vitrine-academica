'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { SuggestThemeForm } from '@/components/event/suggest-theme-form'
import { VoteThemeList } from '@/components/event/vote-theme-list'
import { NavBackPage } from '@/components/nav-back-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getThemeSelection } from '@/server/http/routes/events/get-theme-selection'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'

function ThemeSelectionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-wrap items-start gap-3">
        <Skeleton className="size-14 rounded-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64 rounded-none" />
          <Skeleton className="h-4 w-80 rounded-none" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-none bg-[#ebe6de]" />
        ))}
      </div>
    </div>
  )
}

function statusMessage(phase: string, votingOpen: boolean) {
  if (votingOpen) {
    return 'Sugira temas e vote enquanto a primeira semana estiver aberta.'
  }

  if (phase === 'INSTITUTIONAL_SELECTION') {
    return 'A votação encerrou. A instituição ainda precisa escolher o tema.'
  }

  return 'A escolha de tema deste ciclo já foi concluída.'
}

export function ThemeSelection({ slug, userId }: { slug: string; userId: string }) {
  const selectionQuery = useQuery({
    queryKey: ['event-theme-selection', slug],
    queryFn: () => getThemeSelection(slug),
  })

  const membershipsQuery = useQuery({
    queryKey: ['my-institution-memberships'],
    queryFn: () => getMyInstitutionMemberships(),
  })

  if (selectionQuery.isPending) {
    return <ThemeSelectionSkeleton />
  }

  if (selectionQuery.isError || !selectionQuery.data) {
    return <p className="text-muted-foreground text-sm">Não foi possível carregar a escolha de tema.</p>
  }

  const { event, themes } = selectionQuery.data
  const votingOpen = event.phase === 'THEME_SELECTION'
  const members = membershipsQuery.data?.members ?? []
  const canEdit = canManageInstitution(members, event.institutionId, userId)

  return (
    <div className="flex flex-1 flex-col gap-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-wrap items-start gap-3">
          <NavBackPage label="Voltar para eventos" />
          <div>
            <h1 className="text-2xl font-semibold">{event.name ?? event.slug}</h1>
            <p className="text-muted-foreground text-sm">{statusMessage(event.phase, votingOpen)}</p>
          </div>
        </div>
        {canEdit ? (
          <Button nativeButton={false} render={<Link href={`/eventos/${event.slug}/editar`} />}>
            Editar
          </Button>
        ) : null}
      </div>

      {votingOpen ? (
        <>
          <section className="space-y-3">
            <VoteThemeList eventId={event.id} eventSlug={slug} themes={themes} />
          </section>

          <SuggestThemeForm eventId={event.id} eventSlug={slug} />
        </>
      ) : null}
    </div>
  )
}
