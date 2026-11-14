'use client'

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
import { actionDeleteUserAccount } from '@/server/actions/delete-user-account'

export function DeleteUserAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    try {
      setIsDeleting(true)

      const result = await actionDeleteUserAccount()

      if (!result.success) {
        toast.error(result.message)
        return
      }

      setOpen(false)
      router.push('/')
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button disabled={isDeleting} variant="outline" />}>
        {isDeleting ? 'Excluindo...' : 'Excluir minha conta'}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir sua conta?</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" variant="destructive" disabled={isDeleting} onClick={handleDeleteAccount}>
            {isDeleting ? 'Excluindo...' : 'Excluir conta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
