'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionModerateEventTheme } from '@/server/actions/moderate-event-theme'
import { actionSelectInstitutionalTheme } from '@/server/actions/select-institutional-theme'
import type { Event, EventTheme, EventVoteCounter } from '@/utils/type'

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
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function moderate(themeId: string, action: 'APPROVE' | 'REJECT' | 'HIDE') {
    startTransition(async () => {
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
      router.refresh()
    })
  }

  function selectTheme(themeId: string) {
    startTransition(async () => {
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
      router.refresh()
    })
  }

  const counterMap = new Map(counter.map((item) => [item.themeId, item.votes]))
  const maxVotes = Math.max(0, ...counter.map((item) => item.votes))
  const canSelectTheme = event.phase === 'THEME_SELECTION' || event.phase === 'INSTITUTIONAL_SELECTION'

  const pendingThemes = themes.filter((theme) => theme.status === 'PENDING')
  const approvedThemes = themes.filter((theme) => theme.status === 'APPROVED')
  const otherThemes = themes.filter((theme) => theme.status !== 'PENDING' && theme.status !== 'APPROVED')

  function renderTheme(theme: EventTheme, options: { showSelect?: boolean } = {}) {
    const votes = counterMap.get(theme.id) ?? 0
    const isTopVoted = theme.status === 'APPROVED' && maxVotes > 0 && votes === maxVotes

    return (
      <li key={theme.id} className="space-y-2 border-b border-border py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">
            {theme.title}
            {isTopVoted && (
              <span className="text-muted-foreground ml-2 text-xs font-normal uppercase tracking-wide">
                Mais votado
              </span>
            )}
          </p>
          <span className="text-muted-foreground text-sm">
            {theme.status} · {votes} voto(s)
          </span>
        </div>
        <p className="text-muted-foreground text-sm">{theme.description}</p>
        <div className="flex flex-wrap gap-2">
          {theme.status === 'PENDING' && (
            <>
              <Button size="sm" disabled={pending} onClick={() => moderate(theme.id, 'APPROVE')}>
                Aprovar
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => moderate(theme.id, 'REJECT')}>
                Rejeitar
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => moderate(theme.id, 'HIDE')}>
                Ocultar
              </Button>
            </>
          )}
          {options.showSelect && canSelectTheme && theme.status === 'APPROVED' && (
            <Button size="sm" disabled={pending} onClick={() => selectTheme(theme.id)}>
              Selecionar tema
            </Button>
          )}
        </div>
      </li>
    )
  }

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
        {pendingThemes.length === 0 && otherThemes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tema aguardando moderação.</p>
        ) : (
          <ul className="space-y-3">
            {pendingThemes.map((theme) => renderTheme(theme))}
            {otherThemes.map((theme) => renderTheme(theme))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Decisão institucional</h3>
          <p className="text-muted-foreground text-sm">
            Contagem atual e seleção do tema do ciclo. O mais votado é só uma referência.
          </p>
        </div>
        {approvedThemes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tema aprovado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {[...approvedThemes]
              .sort((a, b) => (counterMap.get(b.id) ?? 0) - (counterMap.get(a.id) ?? 0))
              .map((theme) => renderTheme(theme, { showSelect: true }))}
          </ul>
        )}
      </section>
    </div>
  )
}
