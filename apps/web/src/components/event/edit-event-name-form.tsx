'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actionEditEventName } from '@/server/actions/edit-event-name'

export function EditEventNameForm({
  eventId,
  eventSlug,
  initialName,
}: {
  eventId: string
  eventSlug: string
  initialName: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initialName ?? '')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await actionEditEventName({ eventId, eventSlug, name })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="edit-event-name">Título de exibição</Label>
        <Input
          id="edit-event-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        Salvar
      </Button>
    </form>
  )
}
