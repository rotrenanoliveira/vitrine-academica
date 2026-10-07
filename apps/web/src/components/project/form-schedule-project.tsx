'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionScheduleProject } from '@/server/actions/schedule-project'

type FormScheduleProjectProps = {
  projectId: string
}

export function FormScheduleProject({ projectId }: FormScheduleProjectProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionScheduleProject, {
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
      <h3 className="font-heading text-lg font-semibold">Agendar publicação</h3>
      <input type="hidden" name="project-id" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="published-in">Data de publicação</Label>
        <Input id="published-in" name="published-in" type="datetime-local" required />
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Agendar</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
