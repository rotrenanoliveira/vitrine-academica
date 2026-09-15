'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionRegisterProject } from '@/server/actions/register-project'

type FormRegisterProjectProps = {
  variant?: 'page' | 'sheet'
}

export function FormRegisterProject({ variant = 'page' }: FormRegisterProjectProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionRegisterProject, {
    onSuccess: (message) => {
      toast.success(message)
      if (variant === 'sheet') {
        router.back()
      } else {
        router.push('/projetos')
      }
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Novo projeto</h2>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" type="text" required maxLength={200} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover-attachment">Capa</Label>
        <Input
          id="cover-attachment"
          name="cover-attachment"
          type="file"
          required
          accept="image/png,image/jpeg,image/jpg"
        />
        <p className="text-xs text-muted-foreground">Envie um PNG ou JPG de até 5 MB.</p>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Criar rascunho</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
