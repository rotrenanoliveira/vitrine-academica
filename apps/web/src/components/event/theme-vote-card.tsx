'use client'

import { ThemeCard } from '@/components/event/theme-card'
import { Button } from '@/components/ui/button'
import type { EventTheme } from '@/utils/type'

type ThemeVoteCardProps = {
  theme: EventTheme
  voting: boolean
  onVote: (themeId: string) => void
}

export function ThemeVoteCard({ theme, voting, onVote }: ThemeVoteCardProps) {
  return (
    <ThemeCard
      theme={theme}
      actions={
        <Button type="button" className="w-full" disabled={voting} onClick={() => onVote(theme.id)}>
          {voting ? 'Votando…' : 'Votar'}
        </Button>
      }
    />
  )
}
