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
import { actionRegisterInstitution } from '@/server/actions/register-institution'

const typeOptions = [
  { value: 'UNIVERSITY', label: 'Universidade' },
  { value: 'CENTER', label: 'Centro Educacional' },
  { value: 'TECHNICAL_COLLEGE', label: 'Escola técnica' },
  { value: 'OTHER', label: 'Outro' },
] as const

type FormRegisterInstitutionProps = {
  variant?: 'page' | 'sheet'
}

export function FormRegisterInstitution({ variant = 'page' }: FormRegisterInstitutionProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionRegisterInstitution, {
    onSuccess: (message) => {
      toast.success(message)
      if (variant === 'sheet') {
        router.back()
      } else {
        router.push('/instituicoes')
      }
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-heading text-2xl font-semibold">Nova instituição</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" required maxLength={200} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          required
          defaultValue=""
          className="border-input bg-background h-9 w-full border-b px-0 text-sm outline-none"
        >
          <option value="" disabled>
            Selecione
          </option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" required rows={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domínio de e-mail (opcional)</Label>
        <Input id="domain" name="domain" type="text" placeholder="exemplo.edu.br" />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="should-proof" name="should-proof" value="on" />
        <Label htmlFor="should-proof" className="font-normal leading-snug">
          Exigir comprovante para solicitar entrada
        </Label>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="should-verify" name="should-verify" value="on" />
        <Label htmlFor="should-verify" className="font-normal leading-snug">
          Exigir verificação
        </Label>
      </div>

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Criar instituição</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
