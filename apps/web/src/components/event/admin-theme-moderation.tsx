'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ThemeCard } from '@/components/event/theme-card'
import { Button } from '@/components/ui/button'
import { actionModerateEventTheme } from '@/server/actions/moderate-event-theme'
import { actionSelectInstitutionalTheme } from '@/server/actions/select-institutional-theme'
import type { Event, EventTheme, EventVoteCounter } from '@/utils/type'
import { Separator } from '../ui/separator'

function phaseStatusLabel(phase: Event['phase']) {
  switch (phase) {
    case 'THEME_SELECTION':
      return 'Votação aberta — é possível selecionar um tema aprovado antecipadamente.'
    case 'INSTITUTIONAL_SELECTION':
      return 'Votação encerrada — selecione um tema aprovado para abrir o evento.'
    case 'OPEN':
      return 'Evento aberto — tema já definido.'
    case 'CLOSED':
      return 'Evento encerrado.'
  }
}

export function AdminThemeModeration({
  event,
  themes,
  counter,
}: {
  event: Event
  themes: EventTheme[]
  counter: EventVoteCounter[]
}) {
  const queryClient = useQueryClient()
  const [, startTransition] = useTransition()
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null)

  async function invalidateThemeQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-theme-selection'] }),
      queryClient.invalidateQueries({ queryKey: ['event-vote-counter', event.id] }),
    ])
  }

  function moderate(themeId: string, action: 'APPROVE' | 'REJECT' | 'HIDE') {
    setPendingThemeId(themeId)
    startTransition(async () => {
      try {
        const reason = action === 'REJECT' ? 'Rejeitado pela moderação institucional' : null
        const result = await actionModerateEventTheme({
          themeId,
          eventSlug: event.slug,
          action,
          reason,
        })
        if (!result.success) {
          toast.error(result.message)
          return
        }
        toast.success(result.message)
        await invalidateThemeQueries()
      } finally {
        setPendingThemeId((current) => (current === themeId ? null : current))
      }
    })
  }

  function selectTheme(themeId: string) {
    setPendingThemeId(themeId)
    startTransition(async () => {
      try {
        const result = await actionSelectInstitutionalTheme({
          eventId: event.id,
          eventSlug: event.slug,
          themeId,
        })
        if (!result.success) {
          toast.error(result.message)
          return
        }
        toast.success(result.message)
        await invalidateThemeQueries()
      } finally {
        setPendingThemeId((current) => (current === themeId ? null : current))
      }
    })
  }

  const counterMap = new Map(counter.map((item) => [item.themeId, item.votes]))
  const maxVotes = Math.max(0, ...counter.map((item) => item.votes))
  const canSelectTheme = event.phase === 'THEME_SELECTION' || event.phase === 'INSTITUTIONAL_SELECTION'

  const pendingThemes = themes.filter((theme) => theme.status === 'PENDING')
  const approvedThemes = themes.filter((theme) => theme.status === 'APPROVED')
  const otherThemes = themes.filter((theme) => theme.status !== 'PENDING' && theme.status !== 'APPROVED')
  const moderationThemes = [...pendingThemes, ...otherThemes]
  const sortedApprovedThemes = [...approvedThemes].sort(
    (a, b) => (counterMap.get(b.id) ?? 0) - (counterMap.get(a.id) ?? 0),
  )

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">{phaseStatusLabel(event.phase)}</p>

      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Moderação</h3>
          <p className="text-muted-foreground text-sm">
            Aprove, rejeite ou oculte temas sugeridos antes da decisão institucional.
          </p>
        </div>
        {moderationThemes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tema aguardando moderação.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {moderationThemes.map((theme) => {
              const isPending = pendingThemeId === theme.id
              const showActions = theme.status === 'PENDING'

              return (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  meta={
                    <>
                      {theme.status}
                      {theme.status !== 'PENDING' ? ` · ${counterMap.get(theme.id) ?? 0} voto(s)` : null}
                    </>
                  }
                  actions={
                    showActions ? (
                      <div className="flex gap-2">
                        <Button type="button" disabled={isPending} onClick={() => moderate(theme.id, 'APPROVE')}>
                          {isPending ? 'Aguardando…' : 'Aprovar'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => moderate(theme.id, 'REJECT')}
                        >
                          Rejeitar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => moderate(theme.id, 'HIDE')}
                        >
                          Ocultar
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Decisão institucional</h3>
          <p className="text-muted-foreground text-sm">
            Contagem atual e seleção do tema do ciclo. O mais votado é só uma referência.
          </p>
        </div>
        {sortedApprovedThemes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tema aprovado ainda.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedApprovedThemes.map((theme) => {
              const votes = counterMap.get(theme.id) ?? 0
              const isTopVoted = maxVotes > 0 && votes === maxVotes
              const isPending = pendingThemeId === theme.id

              return (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  meta={
                    <>
                      {votes} voto(s)
                      {isTopVoted ? ' · Mais votado' : null}
                    </>
                  }
                  actions={
                    canSelectTheme ? (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => selectTheme(theme.id)}
                      >
                        {isPending ? 'Selecionando…' : 'Selecionar tema'}
                      </Button>
                    ) : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
