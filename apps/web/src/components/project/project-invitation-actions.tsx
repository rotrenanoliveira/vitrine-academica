'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionRespondProjectInvitation } from '@/server/actions/respond-project-invitation'

type ProjectInvitationActionsProps = {
  invitationId: string
  projectId: string
  projectSlug: string
}

export function ProjectInvitationActions({ invitationId, projectId, projectSlug }: ProjectInvitationActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const options = {
    onSuccess: (message?: string) => {
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'projects'] })
      router.refresh()
    },
    onError: (message: string) => {
      toast.error(message)
    },
  }

  const [_accepted, handleAccept, isAccepting] = useFormState(actionRespondProjectInvitation, options)
  const [_rejected, handleReject, isRejecting] = useFormState(actionRespondProjectInvitation, options)

  const isPending = isAccepting || isRejecting

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleAccept}>
        <input type="hidden" name="invitation-id" value={invitationId} />
        <input type="hidden" name="project-id" value={projectId} />
        <input type="hidden" name="project-slug" value={projectSlug} />
        <input type="hidden" name="status" value="ACCEPTED" />
        <Button type="submit" disabled={isPending}>
          {!isAccepting && <span>Aceitar</span>}
          {isAccepting && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </form>

      <form onSubmit={handleReject}>
        <input type="hidden" name="invitation-id" value={invitationId} />
        <input type="hidden" name="project-id" value={projectId} />
        <input type="hidden" name="project-slug" value={projectSlug} />
        <input type="hidden" name="status" value="REJECTED" />
        <Button type="submit" variant="outline" disabled={isPending}>
          {!isRejecting && <span>Recusar</span>}
          {isRejecting && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </form>
    </div>
  )
}
