'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { actionRegisterProjectInEvent } from '@/server/actions/register-project-in-event'
import type { Project } from '@/utils/type'

export function RegisterProjectForm({
  eventId,
  eventSlug,
  projects,
}: {
  eventId: string
  eventSlug: string
  projects: Project[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')

  if (projects.length === 0) {
    return <p className="text-muted-foreground text-sm">Você não possui projetos publicados para inscrever.</p>
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await actionRegisterProjectInEvent({ eventId, eventSlug, projectId })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-id">Projeto publicado</Label>
        <select
          id="project-id"
          className="border-input bg-background h-9 w-full border-b px-0 text-sm outline-none"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={pending}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending || !projectId}>
        {pending ? 'Inscrevendo…' : 'Inscrever projeto'}
      </Button>
    </form>
  )
}
