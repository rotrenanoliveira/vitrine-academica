'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import type { SubmitEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionPublishProject } from '@/server/actions/publish-project'

type FormPublishProjectProps = {
  projectId: string
}

export function FormPublishProject({ projectId }: FormPublishProjectProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionPublishProject, {
    onSuccess: (message) => {
      toast.success(message)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  function handleConfirm(event: SubmitEvent<HTMLFormElement>) {
    if (!window.confirm('Publicar este projeto agora? Ele ficará visível para todos os usuários.')) {
      event.preventDefault()
      return
    }

    handleSubmit(event)
  }

  return (
    <form className="space-y-4" onSubmit={handleConfirm}>
      <h3 className="font-heading text-lg font-semibold">Publicar agora</h3>
      <p className="text-sm text-muted-foreground">
        O projeto fica visível para todos imediatamente. Se estiver agendado, o agendamento é cancelado.
      </p>
      <input type="hidden" name="project-id" value={projectId} />

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Publicar agora</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
