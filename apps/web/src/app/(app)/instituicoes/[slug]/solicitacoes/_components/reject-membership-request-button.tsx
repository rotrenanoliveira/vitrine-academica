'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionRejectInstitutionMembershipRequest } from '@/server/actions/reject-institution-membership-request'

type RejectMembershipRequestButtonProps = {
  institutionId: string
  institutionSlug: string
  requestId: string
}

export function RejectMembershipRequestButton({
  institutionId,
  institutionSlug,
  requestId,
}: RejectMembershipRequestButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  function handleReject() {
    startTransition(async () => {
      const result = await actionRejectInstitutionMembershipRequest({
        institutionId,
        institutionSlug,
        requestId,
      })

      if (result.success) {
        toast.success(result.message)
        void queryClient.invalidateQueries({ queryKey: ['institution-membership-requests', institutionId] })
        void queryClient.invalidateQueries({ queryKey: ['institution-members', institutionId] })
        router.refresh()
        return
      }

      toast.error(result.message)
    })
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleReject}>
      {!isPending && <span>Rejeitar</span>}
      {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
    </Button>
  )
}
