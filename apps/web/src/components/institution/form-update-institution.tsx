'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hook/use-form-state'
import { actionEditInstitution } from '@/server/actions/edit-institution'
import type { Institution } from '@/utils/type'

type FormUpdateInstitutionProps = {
  institution: Institution
}

export function FormUpdateInstitution({ institution }: FormUpdateInstitutionProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionEditInstitution, {
    onSuccess: (message) => {
      toast.success(message)
      router.push(`/instituicoes/${institution.slug}`)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Editar instituição</h2>
      <input type="hidden" name="institution-id" value={institution.id} />
      <input type="hidden" name="institution-slug" value={institution.slug} />

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" required maxLength={200} defaultValue={institution.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} defaultValue={institution.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domínio de e-mail (opcional)</Label>
        <Input
          id="domain"
          name="domain"
          type="text"
          placeholder="exemplo.edu.br"
          defaultValue={institution.domain ?? ''}
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="should-proof" name="should-proof" value="on" defaultChecked={institution.shouldProof} />
        <Label htmlFor="should-proof" className="font-normal leading-snug">
          Exigir comprovante para solicitar entrada
        </Label>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="should-verify" name="should-verify" value="on" defaultChecked={institution.shouldVerify} />
        <Label htmlFor="should-verify" className="font-normal leading-snug">
          Exigir verificação
        </Label>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Salvar</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
