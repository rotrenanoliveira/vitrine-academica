'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { cn } from '@/lib/utils'
import { actionAuthenticateWithAccessCode } from '@/server/actions/authenticate-with-access-code'
import { actionRequestAccessCode } from '@/server/actions/request-access-code'

type SignInStep = 'email' | 'code'

export function FormSignIn() {
  const router = useRouter()
  const [step, setStep] = useState<SignInStep>('email')
  const [email, setEmail] = useState('')

  const [_, handleRequestCode, isRequesting] = useFormState(actionRequestAccessCode, {
    onSuccess: (message) => {
      toast.success(message)
      setStep('code')
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  const [__, handleAuthenticate, isAuthenticating] = useFormState(actionAuthenticateWithAccessCode, {
    onSuccess: (message) => {
      toast.success(message)
      router.push('/')
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  function handleRequestCodeSubmit(event: SubmitEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const nextEmail = String(formData.get('email') ?? '')
    setEmail(nextEmail)
    return handleRequestCode(event)
  }

  if (step === 'code') {
    return (
      <form className="space-y-4" onSubmit={handleAuthenticate}>
        <input type="hidden" name="email" value={email ?? ''} />

        <div className="space-y-2">
          <Label htmlFor="code">Código de acesso</Label>
          <Input id="code" name="code" type="text" autoComplete="one-time-code" minLength={1} required autoFocus />
          <p className="text-sm text-muted-foreground">
            Enviamos um código para <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep('email')
              setEmail('')
            }}
          >
            Usar outro e-mail
          </Button>
          <Button type="submit" disabled={isAuthenticating}>
            {!isAuthenticating && <span>Entrar</span>}
            {isAuthenticating && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/sign-up" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
            Criar conta
          </Link>
        </p>
      </form>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleRequestCodeSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email ?? ''} required />
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isRequesting}>
          {!isRequesting && <span>Enviar código</span>}
          {isRequesting && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link href="/sign-up" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
          Criar conta
        </Link>
      </p>
    </form>
  )
}
