'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionApplyToCall } from '@/server/actions/apply-to-call'

type FormApplyToCallProps = {
  callId: string
}

export function FormApplyToCall({ callId }: FormApplyToCallProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionApplyToCall, {
    onSuccess: (message) => {
      toast.success(message)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-xl font-semibold">Candidatar-se</h2>
      <input type="hidden" name="call-id" value={callId} />

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem de apresentação (opcional)</Label>
        <Textarea id="message" name="message" rows={4} maxLength={1000} />
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Enviar candidatura</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}