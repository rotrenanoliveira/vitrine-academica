import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import z from 'zod'
import { CallApplicationCard } from '@/components/call/call-application-card'
import { CallApplicationsPanel } from '@/components/call/call-applications-panel'
import { CallDetailsCard } from '@/components/call/call-details-card'
import { CallSkillCard } from '@/components/call/call-skill-card'
import { CloseCallButton } from '@/components/call/close-call-button'
import { FormApplyToCall } from '@/components/call/form-apply-to-call'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { getCall } from '@/server/http/routes/calls/get-call'
import { getMyCallApplications } from '@/server/http/routes/calls/get-my-call-applications'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { isCallAcceptingApplications } from '@/utils/call-utils'

export const metadata: Metadata = {
  title: 'Chamado',
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CallDetailPage({ params }: PageProps) {
  const { id } = await params

  if (!z.uuid().safeParse(id).success) notFound()

  const user = await requireUser()
  const [{ call }, { tags }] = await Promise.all([getCall(id), getCachedTags()])

  const isAuthor = user.id === call.authorId
  const { applications: myApplications } = isAuthor ? { applications: [] } : await getMyCallApplications()
  const myApplication = myApplications.find((application) => application.callId === call.id)
  const accepting = isCallAcceptingApplications(call)
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]))

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 py-8">
        <CallDetailsCard call={call} />

        {isAuthor && call.status === 'OPEN' && (
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href={`/chamados/${call.id}/editar`} />}>
              Editar
            </Button>
            <CloseCallButton callId={call.id} />
          </div>
        )}

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Habilidades necessárias</h2>
          {call.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma habilidade informada.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {call.skills.map((skill) => (
                <CallSkillCard
                  key={skill.id}
                  name={tagNames.get(skill.tagId) ?? 'Habilidade'}
                  description={skill.description}
                />
              ))}
            </div>
          )}
        </section>

        {isAuthor && <CallApplicationsPanel callId={call.id} />}

        {!isAuthor && myApplication && (
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Sua candidatura</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CallApplicationCard
                applicantName={user.name}
                status={myApplication.status}
                message={myApplication.message}
                createdAt={myApplication.createdAt}
                decidedAt={myApplication.decidedAt}
              />
            </div>
          </section>
        )}

        {!isAuthor && !myApplication && accepting && (
          <div className="border border-border p-4">
            <FormApplyToCall callId={call.id} />
          </div>
        )}

        {!isAuthor && !myApplication && !accepting && (
          <p className="text-sm text-muted-foreground">Este chamado não recebe mais candidaturas.</p>
        )}
      </div>
    </div>
  )
}
