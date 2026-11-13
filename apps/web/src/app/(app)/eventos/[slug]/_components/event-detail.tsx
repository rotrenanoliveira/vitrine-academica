'use client'

import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { phaseLabels } from '@/components/event/event-utils'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchApprovedParticipants } from '@/server/http/routes/events/fetch-approved-participants'
import { fetchApprovedThemes } from '@/server/http/routes/events/fetch-approved-themes'
import { getPublicEvent } from '@/server/http/routes/events/get-public-event'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'
import type { Event, EventTheme } from '@/utils/type'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

function EventDetailSkeleton() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true">
      <div className="flex flex-wrap items-start gap-3">
        <Skeleton className="min-h-48 min-w-0 flex-1 rounded-none bg-[#ebe6de]" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-none" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <Skeleton key={index} className="min-h-56 rounded-none bg-[#ebe6de]" />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventInfoCard({
  event,
  winnerTheme,
  canManage,
  isAuthenticated,
}: {
  event: Event
  winnerTheme: EventTheme | undefined
  canManage: boolean
  isAuthenticated: boolean
}) {
  const showRegister = isAuthenticated && event.phase === 'OPEN'

  const eventTitle = event.name ?? event.slug
  const mainTitle = winnerTheme?.title ?? eventTitle

  return (
    <div className="space-y-6">
      <Card className="w-full rounded-none bg-[#ebe6de] shadow-none pr-4">
        <CardHeader>
          <CardTitle className="flex items-center text-3xl normal-case tracking-normal">
            <HugeiconsIcon icon={Calendar03Icon} className="size-6 shrink-0 text-muted-foreground" />
            <span className="ml-2">{mainTitle}</span>
          </CardTitle>
          {winnerTheme ? (
            <p className="pl-8 text-xl font-medium tracking-tight text-foreground sm:text-2xl">{eventTitle}</p>
          ) : null}
        </CardHeader>
        {winnerTheme?.description ? (
          <CardDescription className="whitespace-pre-wrap pl-8">{winnerTheme.description}</CardDescription>
        ) : null}
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Fase</dt>
              <dd>{phaseLabels[event.phase]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Início</dt>
              <dd>
                <time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fim</dt>
              <dd>
                <time dateTime={event.endsAt}>{formatDate(event.endsAt)}</time>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Encerramento escolha dos temas</dt>
              <dd>
                <time dateTime={event.themeSelectionEndsAt}>{formatDate(event.themeSelectionEndsAt)}</time>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {(showRegister || canManage) && (
        <div className="flex flex-wrap gap-2">
          {showRegister ? (
            <Button variant="outline" nativeButton={false} render={<Link href={`/eventos/${event.slug}/inscrever`} />}>
              Inscrever projeto
            </Button>
          ) : null}
          {canManage ? (
            <Button nativeButton={false} render={<Link href={`/eventos/${event.slug}/editar`} />}>
              Editar
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function EventDetail({ slug, userId }: { slug: string; userId?: string }) {
  const eventQuery = useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => getPublicEvent(slug),
  })

  const eventId = eventQuery.data?.event.id

  const themesQuery = useQuery({
    queryKey: ['event-approved-themes', eventId],
    queryFn: () => {
      if (!eventId) throw new Error('Evento sem id')
      return fetchApprovedThemes(eventId)
    },
    enabled: Boolean(eventId),
  })

  const participantsQuery = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: () => {
      if (!eventId) throw new Error('Evento sem id')
      return fetchApprovedParticipants(eventId)
    },
    enabled: Boolean(eventId),
  })

  const membershipsQuery = useQuery({
    queryKey: ['my-institution-memberships'],
    queryFn: () => getMyInstitutionMemberships(),
    enabled: Boolean(userId),
  })

  if (eventQuery.isPending) {
    return <EventDetailSkeleton />
  }

  if (eventQuery.isError || !eventQuery.data) {
    return <p className="text-muted-foreground text-sm">Não foi possível carregar o evento.</p>
  }

  const { event } = eventQuery.data
  const themes = themesQuery.data?.themes ?? []
  const winnerTheme = themes.find((theme) => theme.id === event.winnerThemeId)
  const members = membershipsQuery.data?.members ?? []
  const canManage = userId ? canManageInstitution(members, event.institutionId, userId) : false
  const projects = participantsQuery.data?.projects ?? []

  return (
    <div className="flex flex-1 flex-col gap-12">
      <EventInfoCard event={event} winnerTheme={winnerTheme} canManage={canManage} isAuthenticated={Boolean(userId)} />

      {participantsQuery.isPending ? (
        <section className="space-y-7" aria-busy="true">
          <div>
            <Skeleton className="mb-3 h-3 w-40 rounded-none" />
            <Skeleton className="h-12 w-72 rounded-none" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <Skeleton key={index} className="min-h-56 rounded-none bg-[#ebe6de]" />
            ))}
          </div>
        </section>
      ) : participantsQuery.isError ? (
        <p className="text-muted-foreground text-sm">Não foi possível carregar os projetos.</p>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum projeto aprovado ainda.</p>
      ) : (
        <ProjectGalleryCards
          projects={projects}
          title="Projetos"
          description="Explore os projetos aprovados neste evento."
        />
      )}
    </div>
  )
}
