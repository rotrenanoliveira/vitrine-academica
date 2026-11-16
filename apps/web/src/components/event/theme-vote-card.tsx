'use client'

import Link from 'next/link'
import { ThemeCard } from '@/components/event/theme-card'
import { Button } from '@/components/ui/button'
import type { EventTheme } from '@/utils/type'

type ThemeVoteCardProps = {
  theme: EventTheme
  voting: boolean
  canVote?: boolean
  onVote: (themeId: string) => void
}

export function ThemeVoteCard({ theme, voting, canVote = true, onVote }: ThemeVoteCardProps) {
  return (
    <ThemeCard
      theme={theme}
      actions={
        canVote ? (
          <Button type="button" className="w-full" disabled={voting} onClick={() => onVote(theme.id)}>
            {voting ? 'Votando…' : 'Votar'}
          </Button>
        ) : (
          <Button className="w-full" nativeButton={false} variant="outline" render={<Link href="/sign-in" />}>
            Entrar para votar
          </Button>
        )
      }
    />
  )
}
