'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionLogout } from '@/server/actions/logout'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const result = await actionLogout()

      if (result.success === false) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.push('/sign-in')
      router.refresh()
    })
  }

  return (
    <Button type="button" variant="outline" disabled={isPending} onClick={handleLogout}>
      {!isPending && <span>Sair</span>}
      {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
    </Button>
  )
}
