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
import { actionRegisterProject } from '@/server/actions/register-project'
import { createSlugFromText } from '@/utils/slug'
import type { Tag } from '@/utils/type'

type FormRegisterProjectProps = {
  variant?: 'page' | 'sheet'
  tags: Tag[]
}

export function FormRegisterProject({ variant = 'page', tags }: FormRegisterProjectProps) {
  const router = useRouter()
  const chipsAnchor = useComboboxAnchor()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  const [_, handleSubmit, isPending] = useFormState(actionRegisterProject, {
    onSuccess: (message) => {
      toast.success(message)
      if (variant === 'sheet') {
        router.back()
      } else {
        router.push('/projetos')
      }
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) {
      setSlug(createSlugFromText(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(value)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Novo projeto</h2>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Gerado automaticamente a partir do título; você pode editar.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
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
        {selectedTags.length === 0 ? (
          <p className="text-xs text-muted-foreground">Selecione ao menos uma tag.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover-attachment">Capa</Label>
        <Input id="cover-attachment" name="cover-attachment" type="file" accept="image/png,image/jpeg,image/jpg" />
        <p className="text-xs text-muted-foreground">Opcional. PNG ou JPG de até 5 MB.</p>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending || selectedTags.length === 0 || tags.length === 0}>
          {!isPending && <span>Criar rascunho</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
