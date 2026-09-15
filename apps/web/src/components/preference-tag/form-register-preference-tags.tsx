'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionRegisterPreferenceTags } from '@/server/actions/register-preference-tags'
import type { Tag } from '@/utils/type'

type FormRegisterPreferenceTagsProps = {
  tags: Tag[]
  selectedTagIds: string[]
}

export function FormRegisterPreferenceTags({ tags, selectedTagIds }: FormRegisterPreferenceTagsProps) {
  const router = useRouter()
  const selectedSet = new Set(selectedTagIds)
  const availableTags = tags.filter((tag) => !selectedSet.has(tag.id))

  const [_, handleSubmit, isPending] = useFormState(actionRegisterPreferenceTags, {
    onSuccess: (message) => {
      toast.success(message)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada no sistema.</p>
  }

  if (availableTags.length === 0) {
    return <p className="text-sm text-muted-foreground">Preferências já cadastradas.</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Selecione os assuntos de interesse.</p>
        <ul className="space-y-2">
          {tags.map((tag) => {
            const alreadySelected = selectedSet.has(tag.id)

            return (
              <li key={tag.id} className="flex items-center gap-2">
                <input
                  id={`preference-tag-${tag.id}`}
                  type="checkbox"
                  name="tag-id"
                  value={tag.id}
                  defaultChecked={alreadySelected}
                  disabled={alreadySelected}
                  className="size-4 border border-input accent-primary"
                />
                <Label
                  htmlFor={`preference-tag-${tag.id}`}
                  className={alreadySelected ? 'text-muted-foreground' : undefined}
                >
                  {tag.name}
                </Label>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar preferências</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
