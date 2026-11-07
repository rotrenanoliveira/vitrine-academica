'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const approved = themes.filter((theme) => theme.status === 'APPROVED')

  function vote(themeId: string) {
    startTransition(async () => {
      const result = await actionVoteEventTheme({ eventId, eventSlug, themeId })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      router.refresh()
    })
  }

  if (approved.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum tema aprovado para votação.</p>
  }

  return (
    <ul className="space-y-3">
      {approved.map((theme) => (
        <li key={theme.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-3">
          <div>
            <p className="font-medium">{theme.title}</p>
            <p className="text-muted-foreground text-sm">{theme.description}</p>
          </div>
          <Button type="button" size="sm" disabled={pending} onClick={() => vote(theme.id)}>
            Votar
          </Button>
        </li>
      ))}
    </ul>
  )
}
