'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { actionSuggestEventTheme } from '@/server/actions/suggest-event-theme'

export function SuggestThemeForm({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const queryClient = useQueryClient()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await actionSuggestEventTheme({
        eventId,
        eventSlug,
        title,
        description,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setTitle('')
      setDescription('')
      await queryClient.invalidateQueries({ queryKey: ['event-theme-selection', eventSlug] })
    })
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl space-y-4 border border-border p-4">
      <h2 className="text-lg font-medium">Sugerir tema</h2>
      <div className="space-y-2">
        <Label htmlFor="theme-title">Título</Label>
        <Input id="theme-title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="theme-description">Descrição</Label>
        <Textarea
          id="theme-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Sugerir tema'}
      </Button>
    </form>
  )
}
