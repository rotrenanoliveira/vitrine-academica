'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionUpdateProject } from '@/server/actions/update-project'
import type { Project } from '@/utils/type'

type FormUpdateProjectProps = {
  project: Project
}

const statusOptions = [
  { value: 'SKETCH', label: 'Rascunho' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
] as const

export function FormUpdateProject({ project }: FormUpdateProjectProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionUpdateProject, {
    onSuccess: (message) => {
      toast.success(message)
      router.push(`/projetos/${project.id}`)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Editar projeto</h2>
      <input type="hidden" name="project-id" value={project.id} />

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" type="text" required maxLength={200} defaultValue={project.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} defaultValue={project.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          required
          defaultValue={project.status}
          className="border-input bg-background h-9 w-full border-b px-0 text-sm outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Altere para Publicado para disponibilizar o projeto imediatamente.
        </p>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
