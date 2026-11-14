'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionPublishProject } from '@/server/actions/publish-project'

type FormPublishProjectProps = {
  projectId: string
  projectSlug: string
}

export function FormPublishProject({ projectId, projectSlug }: FormPublishProjectProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [_, handleSubmit, isPending] = useFormState(actionPublishProject, {
    onSuccess: (message) => {
      toast.success(message)
      setOpen(false)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold">Publicar agora</h3>
      <p className="text-sm text-muted-foreground">
        O projeto fica visível para todos imediatamente. Se estiver agendado, o agendamento é cancelado.
      </p>

      <div className="flex w-full items-end justify-end">
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger render={<Button type="button" disabled={isPending} />}>
            {!isPending && <span>Publicar agora</span>}
            {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publicar este projeto agora?</AlertDialogTitle>
              <AlertDialogDescription>
                Ele ficará visível para todos os usuários. Se estiver agendado, o agendamento é cancelado.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <form onSubmit={handleSubmit}>
                <input type="hidden" name="project-id" value={projectId} />
                <input type="hidden" name="project-slug" value={projectSlug} />
                <AlertDialogAction type="submit" disabled={isPending}>
                  {isPending ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
                  Publicar
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
