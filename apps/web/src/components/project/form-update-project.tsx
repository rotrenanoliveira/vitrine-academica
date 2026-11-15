'use client'

import { Cancel01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionUpdateProject } from '@/server/actions/update-project'
import type { ProjectAttachmentPreview } from '@/server/projects/resolve-project-cover-url'
import type { Project } from '@/utils/type'

type FormUpdateProjectProps = {
  project: Project
  canChangeStatus?: boolean
  currentCoverUrl?: string | null
  currentAttachments?: ProjectAttachmentPreview[]
}

const statusOptions = [
  { value: 'SKETCH', label: 'Rascunho' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
] as const

const IMAGE_HINT = 'Opcional. PNG ou JPG de até 5 MB. Recomendado: 1920×1080 px (proporção 16:9).'

export function FormUpdateProject({
  project,
  canChangeStatus = true,
  currentCoverUrl = null,
  currentAttachments = [],
}: FormUpdateProjectProps) {
  const router = useRouter()
  const [keptAttachments, setKeptAttachments] = useState(currentAttachments)

  const [_, handleSubmit, isPending] = useFormState(actionUpdateProject, {
    onSuccess: (message) => {
      toast.success(message)
      router.push(`/projetos/${project.slug}`)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  function handleRemoveAttachment(attachmentId: string) {
    setKeptAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Editar projeto</h2>
      <input type="hidden" name="project-id" value={project.id} />
      <input type="hidden" name="project-slug" value={project.slug} />
      <input type="hidden" name="attachments-managed" value="1" />
      {keptAttachments.map((attachment) => (
        <input key={attachment.id} type="hidden" name="kept-attachment-id" value={attachment.id} />
      ))}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" type="text" required maxLength={200} defaultValue={project.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} defaultValue={project.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover-attachment">Capa</Label>
        {currentCoverUrl ? (
          <div className="relative mb-2 aspect-video w-full overflow-hidden border border-border bg-muted">
            <Image
              src={currentCoverUrl}
              alt={`Capa atual de ${project.title}`}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma capa definida ainda.</p>
        )}
        <Input id="cover-attachment" name="cover-attachment" type="file" accept="image/png,image/jpeg,image/jpg" />
        <p className="text-xs text-muted-foreground">
          {IMAGE_HINT} Envie um arquivo novo para substituir a capa atual.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-attachments">Imagens do projeto</Label>
        {keptAttachments.length > 0 ? (
          <ul className="mb-2 grid gap-2 sm:grid-cols-2">
            {keptAttachments.map((attachment, index) => (
              <li key={attachment.id} className="relative aspect-video overflow-hidden border border-border bg-muted">
                <Image
                  src={attachment.url}
                  alt={`Imagem ${index + 1} de ${project.title}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="absolute top-2 right-2"
                  aria-label={`Remover imagem ${index + 1}`}
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma imagem adicional definida ainda.</p>
        )}
        <Input
          id="project-attachments"
          name="project-attachments"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
        />
        <p className="text-xs text-muted-foreground">
          Até 4 imagens no total. PNG ou JPG de até 5 MB cada. Recomendado: 1920×1080 px (proporção 16:9). Novos
          arquivos são adicionados às imagens mantidas. Use o botão em cada preview para remover.
        </p>
      </div>

      {canChangeStatus ? (
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
      ) : (
        <input type="hidden" name="status" value={project.status} />
      )}

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
