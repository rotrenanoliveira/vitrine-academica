'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionRegisterUser } from '@/server/actions/register-user'

export function FormRegisterUser() {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionRegisterUser, {
    onSuccess: (message) => {
      toast.success(message)
      router.push('/sign-in')
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="consent" name="consent" value="on" required />
        <Label htmlFor="consent" className="font-normal leading-snug">
          Li e aceito o tratamento dos meus dados para criação da conta.
        </Label>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Criar conta</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
