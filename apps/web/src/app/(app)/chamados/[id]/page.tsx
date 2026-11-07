import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import z from 'zod'
import { CallApplicationsPanel } from '@/components/call/call-applications-panel'
import { CloseCallButton } from '@/components/call/close-call-button'
import { FormApplyToCall } from '@/components/call/form-apply-to-call'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { getCall } from '@/server/http/routes/calls/get-call'
import { getMyCallApplications } from '@/server/http/routes/calls/get-my-call-applications'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import {
  applicationStatusLabels,
  formatCallDate,
  getCallStatusLabel,
  isCallAcceptingApplications,
} from '@/utils/call-utils'

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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/chamados" />}>Chamados</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chamado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 py-8">
        <div className="space-y-3">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{getCallStatusLabel(call)}</p>
          <h1 className="font-heading text-3xl font-semibold">{call.title}</h1>
          <p className="text-xs text-muted-foreground">
            Candidaturas até {formatCallDate(call.applicationDeadline)} · Publicado em {formatCallDate(call.createdAt)}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">Proposta</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{call.description}</p>
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">Habilidades necessárias</h2>
          <ul className="space-y-2">
            {call.skills.map((skill) => (
              <li key={skill.id} className="border border-border px-3 py-2">
                <p className="text-xs tracking-wider uppercase">{tagNames.get(skill.tagId) ?? 'Habilidade'}</p>
                {skill.description && <p className="text-sm text-muted-foreground">{skill.description}</p>}
              </li>
            ))}
          </ul>
        </div>

        {isAuthor && call.status === 'OPEN' && (
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href={`/chamados/${call.id}/editar`} />}>
              Editar
            </Button>
            <CloseCallButton callId={call.id} />
          </div>
        )}

        {isAuthor && <CallApplicationsPanel callId={call.id} />}

        {!isAuthor && myApplication && (
          <div className="space-y-2 border border-border p-4">
            <h2 className="font-heading text-lg font-semibold">Sua candidatura</h2>
            <p className="text-sm">Status: {applicationStatusLabels[myApplication.status]}</p>
            {myApplication.message && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{myApplication.message}</p>
            )}
          </div>
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