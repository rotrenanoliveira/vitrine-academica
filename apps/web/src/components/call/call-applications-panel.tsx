import { getCallApplications } from '@/server/http/routes/calls/get-call-applications'
import { CallApplicationCard } from './call-application-card'
import { DecideApplicationButtons } from './decide-application-buttons'

type CallApplicationsPanelProps = {
  callId: string
}

export async function CallApplicationsPanel({ callId }: CallApplicationsPanelProps) {
  const { applications } = await getCallApplications(callId)

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">Candidaturas recebidas</h2>

      {applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma candidatura recebida ainda.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <CallApplicationCard
              key={application.id}
              applicantName={application.applicantName}
              applicantId={application.applicantId}
              status={application.status}
              message={application.message}
              createdAt={application.createdAt}
              decidedAt={application.decidedAt}
              actions={
                application.status === 'PENDING' ? (
                  <DecideApplicationButtons callId={callId} applicationId={application.id} />
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
