'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
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
  const chipsAnchor = useComboboxAnchor()
  const initialSkills = new Map((call?.skills ?? []).map((skill) => [skill.tagId, skill.description ?? '']))
  const initialSelected = tags.filter((tag) => initialSkills.has(tag.id))
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialSelected)

  const [_, handleSubmit, isPending] = useFormState(call ? actionUpdateCall : actionRegisterCall, {
    onSuccess: (message) => {
      toast.success(message)
      router.push(call ? `/chamados/${call.id}` : '/me/chamados')
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

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

      <div className="space-y-2">
        <Label>Habilidades necessárias</Label>
        <p className="text-sm text-muted-foreground">Busque e selecione as habilidades do chamado.</p>
        {selectedTags.map((tag) => (
          <input key={tag.id} type="hidden" name="tag-id" value={tag.id} />
        ))}
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada no sistema.</p>
        ) : (
          <Combobox
            multiple
            items={tags}
            value={selectedTags}
            onValueChange={(value) => setSelectedTags(value)}
            itemToStringLabel={(tag) => tag.name}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <ComboboxChips ref={chipsAnchor} className="w-full">
              {selectedTags.map((tag) => (
                <ComboboxChip key={tag.id}>{tag.name}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Buscar tags..." />
            </ComboboxChips>
            <ComboboxContent anchor={chipsAnchor}>
              <ComboboxEmpty>Nenhuma tag encontrada.</ComboboxEmpty>
              <ComboboxList>
                {(tag: Tag) => (
                  <ComboboxItem key={tag.id} value={tag}>
                    {tag.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </div>

      {selectedTags.length > 0 && (
        <ul className="space-y-3">
          {selectedTags.map((tag) => (
            <li key={tag.id} className="space-y-2">
              <Label htmlFor={`skill-description-${tag.id}`}>{tag.name}</Label>
              <Input
                id={`skill-description-${tag.id}`}
                name={`skill-description-${tag.id}`}
                type="text"
                maxLength={200}
                placeholder="Detalhe da habilidade (opcional)"
                defaultValue={initialSkills.get(tag.id) ?? ''}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending || tags.length === 0}>
          {!isPending && <span>{call ? 'Salvar alterações' : 'Criar chamado'}</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
