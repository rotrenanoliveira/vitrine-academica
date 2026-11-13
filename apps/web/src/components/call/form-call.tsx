'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionRegisterCall } from '@/server/actions/register-call'
import { actionUpdateCall } from '@/server/actions/update-call'
import type { CallWithSkills } from '@/utils/call-type'
import { toDateTimeLocalValue } from '@/utils/call-utils'
import type { Tag } from '@/utils/type'

type FormCallProps = {
  tags: Tag[]
  call?: CallWithSkills
}

export function FormCall({ tags, call }: FormCallProps) {
  const router = useRouter()
  const initialSkills = new Map((call?.skills ?? []).map((skill) => [skill.tagId, skill.description ?? '']))
  const [selected, setSelected] = useState(() => new Set(initialSkills.keys()))

  const [_, handleSubmit, isPending] = useFormState(call ? actionUpdateCall : actionRegisterCall, {
    onSuccess: (message) => {
      toast.success(message)
      router.push(call ? `/chamados/${call.id}` : '/chamados/meus')
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  function toggleTag(tagId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(tagId)
      } else {
        next.delete(tagId)
      }

      return next
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">{call ? 'Editar chamado' : 'Novo chamado'}</h2>

      {call && <input type="hidden" name="call-id" value={call.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" type="text" required maxLength={200} defaultValue={call?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Proposta</Label>
        <Textarea id="description" name="description" required rows={5} defaultValue={call?.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="application-deadline">Prazo das candidaturas</Label>
        <Input
          id="application-deadline"
          name="application-deadline"
          type="datetime-local"
          required
          defaultValue={call ? toDateTimeLocalValue(call.applicationDeadline) : undefined}
        />
        <p className="text-xs text-muted-foreground">Horário de Brasília.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Habilidades necessárias</legend>

        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada no sistema.</p>
        ) : (
          <ul className="space-y-3">
            {tags.map((tag) => {
              const checked = selected.has(tag.id)

              return (
                <li key={tag.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id={`call-tag-${tag.id}`}
                      type="checkbox"
                      name="tag-id"
                      value={tag.id}
                      checked={checked}
                      onChange={(event) => toggleTag(tag.id, event.target.checked)}
                      className="size-4 border border-input accent-primary"
                    />
                    <Label htmlFor={`call-tag-${tag.id}`}>{tag.name}</Label>
                  </div>

                  {checked && (
                    <Input
                      name={`skill-description-${tag.id}`}
                      type="text"
                      maxLength={200}
                      placeholder="Detalhe da habilidade (opcional)"
                      aria-label={`Detalhe da habilidade ${tag.name}`}
                      defaultValue={initialSkills.get(tag.id) ?? ''}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </fieldset>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending || tags.length === 0}>
          {!isPending && <span>{call ? 'Salvar alterações' : 'Criar chamado'}</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
