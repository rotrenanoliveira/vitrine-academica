'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionCloseCall } from '@/server/actions/close-call'

type CloseCallButtonProps = {
  callId: string
}

export function CloseCallButton({ callId }: CloseCallButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (!window.confirm('Encerrar este chamado? Ele deixará de receber candidaturas.')) return

    startTransition(async () => {
      const result = await actionCloseCall({ callId })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <Button type="button" variant="outline" disabled={isPending} onClick={handleClose}>
      Encerrar chamado
    </Button>
  )
}