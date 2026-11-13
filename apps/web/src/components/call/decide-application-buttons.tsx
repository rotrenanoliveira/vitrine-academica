'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionDecideCallApplication } from '@/server/actions/decide-call-application'

type DecideApplicationButtonsProps = {
  callId: string
  applicationId: string
}

export function DecideApplicationButtons({ callId, applicationId }: DecideApplicationButtonsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDecision(decision: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const result = await actionDecideCallApplication({ callId, applicationId, decision })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      if (result.notified === false) {
        toast.warning(result.message)
      } else {
        toast.success(result.message)
      }

      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={isPending} onClick={() => handleDecision('APPROVED')}>
        Aprovar
      </Button>
      <Button type="button" variant="outline" disabled={isPending} onClick={() => handleDecision('REJECTED')}>
        Rejeitar
      </Button>
    </div>
  )
}
