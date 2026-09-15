'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { actionUpdateInstitutionMemberStatus } from '@/server/actions/update-institution-member-status'
import type { InstitutionMemberStatus } from '@/utils/type'

const statusOptions: { value: InstitutionMemberStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'REJECTED', label: 'Rejeitado' },
]

type UpdateMemberStatusButtonProps = {
  institutionId: string
  institutionSlug: string
  memberId: string
  currentStatus: InstitutionMemberStatus
}

export function UpdateMemberStatusButton({
  institutionId,
  institutionSlug,
  memberId,
  currentStatus,
}: UpdateMemberStatusButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)

  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  function handleStatusChange(nextStatus: InstitutionMemberStatus) {
    if (nextStatus === currentStatus) return

    const previous = status
    setStatus(nextStatus)

    startTransition(async () => {
      const result = await actionUpdateInstitutionMemberStatus({
        institutionId,
        institutionSlug,
        memberId,
        status: nextStatus,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
        return
      }

      setStatus(previous)
      toast.error(result.message)
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor={`member-status-${memberId}`} className="sr-only">
        Atualizar status
      </Label>
      <select
        id={`member-status-${memberId}`}
        className="border-input bg-background h-9 min-w-36 border-b px-0 text-sm outline-none"
        value={status}
        disabled={isPending}
        onChange={(event) => {
          handleStatusChange(event.target.value as InstitutionMemberStatus)
        }}
      >
        {statusOptions.map((option) => (
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
