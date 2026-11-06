'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actionReviewEventRegistration } from '@/server/actions/review-event-registration'
import type { EventRegistration, Project } from '@/utils/type'

export function AdminRegistrationQueue({
  eventSlug,
  registrations,
  projects,
}: {
  eventSlug: string
  registrations: EventRegistration[]
  projects: Project[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const projectMap = new Map(projects.map((project) => [project.id, project]))

  function review(registrationId: string, action: 'APPROVE' | 'REJECT', reviewReason?: string | null) {
    startTransition(async () => {
      const result = await actionReviewEventRegistration({
        registrationId,
        eventSlug,
        action,
        reason: reviewReason,
      })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      setRejectingId(null)
      setReason('')
      router.refresh()
    })
  }

  if (registrations.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma inscrição pendente.</p>
  }

  return (
    <ul className="space-y-3">
      {registrations.map((registration) => {
        const project = projectMap.get(registration.projectId)

        return (
          <li key={registration.id} className="space-y-2 border-b border-border py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{project?.title ?? `Projeto ${registration.projectId}`}</p>
              <span className="text-muted-foreground text-sm">{registration.status}</span>
            </div>
            {project?.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={pending} onClick={() => review(registration.id, 'APPROVE')}>
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setRejectingId(registration.id)
                  setReason('')
                }}
              >
                Rejeitar
              </Button>
            </div>
            {rejectingId === registration.id && (
              <div className="space-y-2">
                <textarea
                  className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Motivo da rejeição"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending || !reason.trim()}
                    onClick={() => review(registration.id, 'REJECT', reason.trim())}
                  >
                    Confirmar rejeição
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setRejectingId(null)
                      setReason('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
