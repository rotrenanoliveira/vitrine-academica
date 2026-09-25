'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { actionUpdateInstitutionMemberRole } from '@/server/actions/update-institution-member-role'
import type { InstitutionMemberRole } from '@/utils/type'

const roleOptions: { value: InstitutionMemberRole; label: string }[] = [
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'TEACHER', label: 'Docente' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'ADMINISTRATIVE_OFFICE', label: 'Secretaria' },
]

type UpdateMemberRoleButtonProps = {
  institutionId: string
  institutionSlug: string
  memberId: string
  currentRole: InstitutionMemberRole
}

export function UpdateMemberRoleButton({
  institutionId,
  institutionSlug,
  memberId,
  currentRole,
}: UpdateMemberRoleButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(currentRole)

  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  function handleRoleChange(nextRole: InstitutionMemberRole) {
    if (nextRole === currentRole) return

    const previous = role
    setRole(nextRole)

    startTransition(async () => {
      const result = await actionUpdateInstitutionMemberRole({
        institutionId,
        institutionSlug,
        memberId,
        role: nextRole,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
        return
      }

      setRole(previous)
      toast.error(result.message)
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor={`member-role-${memberId}`} className="sr-only">
        Atualizar cargo
      </Label>
      <select
        id={`member-role-${memberId}`}
        className="border-input bg-background h-9 min-w-36 border-b px-0 text-sm outline-none"
        value={role}
        disabled={isPending}
        onChange={(event) => {
          handleRoleChange(event.target.value as InstitutionMemberRole)
        }}
      >
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending && (
        <HugeiconsIcon icon={Loading03Icon} className="size-4 shrink-0 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
