'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionApproveInstitutionMembershipRequest } from '@/server/actions/approve-institution-membership-request'

type ApproveMembershipRequestButtonProps = {
  institutionId: string
  institutionSlug: string
  requestId: string
}

export function ApproveMembershipRequestButton({
  institutionId,
  institutionSlug,
  requestId,
}: ApproveMembershipRequestButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await actionApproveInstitutionMembershipRequest({
        institutionId,
        institutionSlug,
        requestId,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
        return
      }

      toast.error(result.message)
    })
  }

  return (
    <Button type="button" size="sm" disabled={isPending} onClick={handleApprove}>
      {!isPending && <span>Aprovar</span>}
      {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
    </Button>
  )
}
