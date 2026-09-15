'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { actionUpdateInstitutionStatus } from '@/server/actions/update-institution-status'
import type { Institution, InstitutionStatus } from '@/utils/type'

const statusOptions: { value: InstitutionStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa' },
  { value: 'SUSPENDED', label: 'Suspensa' },
  { value: 'ARCHIVED', label: 'Arquivada' },
]

type InstitutionStatusActionsProps = {
  institution: Institution
}

export function InstitutionStatusActions({ institution }: InstitutionStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(institution.status)

  useEffect(() => {
    setStatus(institution.status)
  }, [institution.status])

  function handleStatusChange(nextStatus: InstitutionStatus) {
    if (nextStatus === institution.status) return

    const previous = status
    setStatus(nextStatus)

    startTransition(async () => {
      const result = await actionUpdateInstitutionStatus({
        institutionId: institution.id,
        institutionSlug: institution.slug,
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
    <div className="space-y-3 border border-border p-4">
      <div className="space-y-2">
        <Label htmlFor="institution-status">Atualizar status</Label>
        <div className="flex items-center gap-2">
          <select
            id="institution-status"
            className="border-input bg-background h-9 w-full border-b px-0 text-sm outline-none"
            value={status}
            disabled={isPending}
            onChange={(event) => {
              handleStatusChange(event.target.value as InstitutionStatus)
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
      </div>
    </div>
  )
}
