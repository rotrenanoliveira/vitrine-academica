'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionInviteProjectMember } from '@/server/actions/invite-project-member'

type FormInviteProjectMemberProps = {
  projectId: string
  projectSlug: string
}

export function FormInviteProjectMember({ projectId, projectSlug }: FormInviteProjectMemberProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [_, handleSubmit, isPending] = useFormState(actionInviteProjectMember, {
    reset: true,
    formRef,
    onSuccess: (message) => {
      toast.success(message)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <h3 className="font-heading text-lg font-semibold">Convidar coautor</h3>
      <p className="text-sm text-muted-foreground">
        Digite o e-mail de quem tem conta no site. A pessoa recebe o convite e escolhe se aceita.
      </p>
      <input type="hidden" name="project-id" value={projectId} />
      <input type="hidden" name="project-slug" value={projectSlug} />

      <div className="space-y-2">
        <Label htmlFor="member-email">E-mail</Label>
        <Input id="member-email" name="email" type="email" placeholder="colega@exemplo.com" required />
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Convidar</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
