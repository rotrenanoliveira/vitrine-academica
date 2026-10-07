'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { actionDeleteUserAccount } from '@/server/actions/delete-user-account'

export function DeleteUserAccountButton() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)

      const result = await actionDeleteUserAccount()

      if (!result.success) {
        alert(result.message)
        return
      }

      router.push('/')
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button onClick={handleDeleteAccount} disabled={isDeleting} variant="outline">
      {isDeleting ? 'Excluindo...' : 'Excluir minha conta'}
    </Button>
  )
}
