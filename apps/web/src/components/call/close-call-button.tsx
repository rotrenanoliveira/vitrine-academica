'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
import { actionCloseCall } from '@/server/actions/close-call'

type CloseCallButtonProps = {
  callId: string
}

export function CloseCallButton({ callId }: CloseCallButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    startTransition(async () => {
      const result = await actionCloseCall({ callId })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="outline" disabled={isPending} />}>
        Encerrar chamado
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar este chamado?</AlertDialogTitle>
          <AlertDialogDescription>Ele deixará de receber candidaturas.</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" disabled={isPending} onClick={handleClose}>
            Encerrar chamado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
