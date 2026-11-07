'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actionCreateEventCycle } from '@/server/actions/create-event-cycle'
import type { ParticipationScope } from '@/utils/type'

export function CreateEventForm({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [scope, setScope] = useState<ParticipationScope>('GLOBAL')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await actionCreateEventCycle({
        institutionId,
        participationScope: scope,
        name: name.trim() || null,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.push(`/eventos/${result.event.slug}/editar`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-name">Título (opcional)</Label>
        <Input id="event-name" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-scope">Escopo de participação</Label>
        <select
          id="event-scope"
          className="border-input bg-background h-9 w-full border-b px-0 text-sm outline-none"
          value={scope}
          onChange={(e) => setScope(e.target.value as ParticipationScope)}
          disabled={pending}
        >
          <option value="GLOBAL">Global (qualquer autenticado)</option>
          <option value="INSTITUTION">Instituição (somente membros ativos)</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Criando…' : 'Abrir escolha de tema'}
      </Button>
    </form>
  )
}
