'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ThemeVoteCard } from '@/components/event/theme-vote-card'
import { actionVoteEventTheme } from '@/server/actions/vote-event-theme'
import type { EventTheme } from '@/utils/type'

export function VoteThemeList({
  eventId,
  eventSlug,
  themes,
}: {
  eventId: string
  eventSlug: string
  themes: EventTheme[]
}) {
  const queryClient = useQueryClient()
  const [, startTransition] = useTransition()
  const [votingThemeId, setVotingThemeId] = useState<string | null>(null)
  const approved = themes.filter((theme) => theme.status === 'APPROVED')

  function vote(themeId: string) {
    setVotingThemeId(themeId)
    startTransition(async () => {
      try {
        const result = await actionVoteEventTheme({ eventId, eventSlug, themeId })

        if (!result.success) {
          toast.error(result.message)
          return
        }

        toast.success(result.message)
        await queryClient.invalidateQueries({ queryKey: ['event-theme-selection', eventSlug] })
      } finally {
        setVotingThemeId((current) => (current === themeId ? null : current))
      }
    })
  }

  if (approved.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum tema aprovado para votação.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {approved.map((theme) => (
        <ThemeVoteCard key={theme.id} theme={theme} voting={votingThemeId === theme.id} onVote={vote} />
      ))}
    </div>
  )
}
