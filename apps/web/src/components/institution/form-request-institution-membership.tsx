'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hook/use-form-state'
import { actionRequestInstitutionMembership } from '@/server/actions/request-institution-membership'
import type { InstitutionMemberRole } from '@/utils/type'

const roleOptions: { value: InstitutionMemberRole; label: string }[] = [
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'TEACHER', label: 'Docente' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'ADMINISTRATIVE_OFFICE', label: 'Secretaria' },
]

const selectClassName = 'border-input bg-background h-9 w-full border-b px-0 text-sm outline-none'

type PickerInstitution = {
  id: string
  slug: string
  name: string
  shouldProof: boolean
}

type FormRequestInstitutionMembershipFixedProps = {
  variant?: 'fixed'
  institutionId: string
  institutionSlug: string
  shouldProof: boolean
  alreadyMember?: boolean
}

type FormRequestInstitutionMembershipPickerProps = {
  variant: 'picker'
  institutions: PickerInstitution[]
}

type FormRequestInstitutionMembershipProps =
  | FormRequestInstitutionMembershipFixedProps
  | FormRequestInstitutionMembershipPickerProps

function RoleSelect() {
  return (
    <div className="space-y-2">
      <Label htmlFor="role">Papel desejado</Label>
      <select id="role" name="role" required defaultValue="" className={selectClassName}>
        <option value="" disabled>
          Selecione
        </option>
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ProofAttachmentField() {
  return (
    <div className="space-y-2">
      <Label htmlFor="proof-attachment">Comprovante</Label>
      <Input
        id="proof-attachment"
        name="proof-attachment"
        type="file"
        required
        accept="image/png,image/jpeg,image/jpg,application/pdf"
      />
      <p className="text-xs text-muted-foreground">Envie um PNG, JPG ou PDF de até 5 MB.</p>
    </div>
  )
}

export function FormRequestInstitutionMembership(props: FormRequestInstitutionMembershipProps) {
  if (props.variant === 'picker') {
    return <FormRequestInstitutionMembershipPicker institutions={props.institutions} />
  }

  return (
    <FormRequestInstitutionMembershipFixed
      institutionId={props.institutionId}
      institutionSlug={props.institutionSlug}
      shouldProof={props.shouldProof}
      alreadyMember={props.alreadyMember}
    />
  )
}

function FormRequestInstitutionMembershipFixed({
  institutionId,
  institutionSlug,
  shouldProof,
  alreadyMember = false,
}: FormRequestInstitutionMembershipFixedProps) {
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionRequestInstitutionMembership, {
    onSuccess: (message) => {
      toast.success(message)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (alreadyMember) return null

  return (
    <form className="space-y-4 border border-border p-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Solicitar entrada</h2>
        <p className="text-sm text-muted-foreground">Envie um pedido para fazer parte desta instituição.</p>
      </div>

      <input type="hidden" name="institution-id" value={institutionId} />
      <input type="hidden" name="institution-slug" value={institutionSlug} />

      <RoleSelect />
      {shouldProof && <ProofAttachmentField />}

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending}>
          {!isPending && <span>Enviar solicitação</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}

function FormRequestInstitutionMembershipPicker({ institutions }: { institutions: PickerInstitution[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedId, setSelectedId] = useState('')

  const selected = institutions.find((institution) => institution.id === selectedId)

  const [_, handleSubmit, isPending] = useFormState(actionRequestInstitutionMembership, {
    formRef,
    reset: true,
    onSuccess: (message) => {
      toast.success(message)
      setSelectedId('')
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (institutions.length === 0) {
    return <p className="text-sm text-muted-foreground">Você já participa de todas as instituições disponíveis.</p>
  }

  return (
    <form ref={formRef} className="space-y-4 border border-border p-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Solicitar entrada</h2>
        <p className="text-sm text-muted-foreground">Escolha uma instituição e envie seu pedido de entrada.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution-picker">Instituição</Label>
        <select
          id="institution-picker"
          required
          value={selectedId}
          className={selectClassName}
          onChange={(event) => {
            setSelectedId(event.target.value)
          }}
        >
          <option value="" disabled>
            Selecione
          </option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="institution-id" value={selected?.id ?? ''} />
      <input type="hidden" name="institution-slug" value={selected?.slug ?? ''} />

      <RoleSelect />
      {selected?.shouldProof ? <ProofAttachmentField /> : null}

      <div className="flex w-full items-end justify-end">
        <Button type="submit" disabled={isPending || !selected}>
          {!isPending && <span>Enviar solicitação</span>}
          {isPending && <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
