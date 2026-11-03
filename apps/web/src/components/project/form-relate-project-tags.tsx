'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const linkedSet = new Set(project.tags)

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
      <p className="text-sm text-muted-foreground">Marque ou desmarque as tags relacionadas ao projeto.</p>
      <input type="hidden" name="project-id" value={project.id} />

      <ul className="space-y-2">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center gap-2">
            <input
              id={`project-tag-${tag.id}`}
              type="checkbox"
              name="tag-id"
              value={tag.id}
              defaultChecked={linkedSet.has(tag.id)}
              className="size-4 border border-input accent-primary"
            />
            <Label htmlFor={`project-tag-${tag.id}`}>{tag.name}</Label>
          </li>
        ))}
      </ul>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar tags</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
