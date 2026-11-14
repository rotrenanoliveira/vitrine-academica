'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ProjectReviewCard } from '@/components/event/project-review-card'
import { Button } from '@/components/ui/button'
import { actionReviewEventRegistration } from '@/server/actions/review-event-registration'
import type { EventRegistration, Project } from '@/utils/type'

export function AdminRegistrationQueue({
  eventId,
  eventSlug,
  registrations,
  projects,
}: {
  eventId: string
  eventSlug: string
  registrations: EventRegistration[]
  projects: Project[]
}) {
  const queryClient = useQueryClient()
  const [, startTransition] = useTransition()
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const projectMap = new Map(projects.map((project) => [project.id, project]))

  function review(registrationId: string, action: 'APPROVE' | 'REJECT', reviewReason?: string | null) {
    setPendingRegistrationId(registrationId)
    startTransition(async () => {
      try {
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
        await queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId, 'PENDING'] })
      } finally {
        setPendingRegistrationId((current) => (current === registrationId ? null : current))
      }
    })
  }

  if (registrations.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma inscrição pendente.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {registrations.map((registration) => {
        const project = projectMap.get(registration.projectId)
        const isPending = pendingRegistrationId === registration.id
        const isRejecting = rejectingId === registration.id
        const title = project?.title ?? `Projeto ${registration.projectId}`
        const description = project?.description ?? ''

        return (
          <ProjectReviewCard
            key={registration.id}
            title={title}
            description={description}
            projectSlug={project?.slug ?? null}
            meta={registration.status}
            actions={
              isRejecting ? (
                <div className="space-y-2">
                  <textarea
                    className="border-input bg-background min-h-20 w-full rounded-none border px-3 py-2 text-sm"
                    placeholder="Motivo da rejeição"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={isPending}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isPending || !reason.trim()}
                      onClick={() => review(registration.id, 'REJECT', reason.trim())}
                    >
                      {isPending ? 'Aguardando…' : 'Confirmar rejeição'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => {
                        setRejectingId(null)
                        setReason('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={isPending} onClick={() => review(registration.id, 'APPROVE')}>
                    {isPending ? 'Aguardando…' : 'Aprovar'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => {
                      setRejectingId(registration.id)
                      setReason('')
                    }}
                  >
                    Rejeitar
                  </Button>
                </div>
              )
            }
          />
        )
      })}
    </div>
  )
}
