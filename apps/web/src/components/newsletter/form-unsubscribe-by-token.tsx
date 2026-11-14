'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionUnsubscribeByToken } from '@/server/actions/unsubscribe-by-token'

type FormUnsubscribeByTokenProps = {
  token: string
}

export function FormUnsubscribeByToken({ token }: FormUnsubscribeByTokenProps) {
  const queryClient = useQueryClient()
  const [done, setDone] = useState(false)

  const [_, handleSubmit, isPending] = useFormState(actionUnsubscribeByToken, {
    onSuccess: (message) => {
      setDone(true)
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'subscriptions'] })
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (done) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Inscrição cancelada</h1>
        <p className="text-sm text-muted-foreground">
          Você não receberá mais avisos por e-mail quando este autor publicar novos projetos.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Cancelar acompanhamento</h1>
        <p className="text-sm text-muted-foreground">
          Confirme para deixar de receber e-mails quando este autor publicar novos projetos.
        </p>
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
        Confirmar cancelamento
      </Button>
    </form>
  )
}
