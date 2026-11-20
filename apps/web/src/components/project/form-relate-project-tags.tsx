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
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionRegisterProjectTags } from '@/server/actions/register-project-tags'
import type { Project, Tag } from '@/utils/type'

type FormRelateProjectTagsProps = {
  project: Project
  tags: Tag[]
}

export function FormRelateProjectTags({ project, tags }: FormRelateProjectTagsProps) {
  const router = useRouter()
  const chipsAnchor = useComboboxAnchor()
  const initialSelected = tags.filter((tag) => project.tags.includes(tag.id))
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialSelected)

  const [_, handleSubmit, isPending] = useFormState(actionRegisterProjectTags, {
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

  return (
    <form key={[...project.tags].sort().join(',')} className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-xl font-semibold">Tags do projeto</h2>
      <input type="hidden" name="project-id" value={project.id} />
      <input type="hidden" name="project-slug" value={project.slug} />

      <div className="space-y-2">
        <Label>Tags</Label>
        <p className="text-sm text-muted-foreground">Busque e selecione as tags do projeto.</p>
        {selectedTags.map((tag) => (
          <input key={tag.id} type="hidden" name="tag-id" value={tag.id} />
        ))}
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
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar tags</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
