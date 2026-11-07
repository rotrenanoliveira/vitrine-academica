import { getCallApplications } from '@/server/http/routes/calls/get-call-applications'
import { applicationStatusLabels, formatCallDate, memberRoleLabels } from '@/utils/call-utils'
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
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id} className="space-y-3 border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium">{application.applicant.name}</p>

                  {application.applicant.memberships.length > 0 ? (
                    <ul className="text-sm text-muted-foreground">
                      {application.applicant.memberships.map((membership) => (
                        <li key={membership.institutionId}>
                          {membership.institutionName} · {memberRoleLabels[membership.role]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem vínculo institucional informado.</p>
                  )}
                </div>

                <p className="text-xs tracking-wider text-muted-foreground uppercase">
                  {applicationStatusLabels[application.status]}
                </p>
              </div>

              {application.message && <p className="whitespace-pre-wrap text-sm">{application.message}</p>}

              <p className="text-xs text-muted-foreground">
                Enviada em {formatCallDate(application.createdAt)}
                {application.decidedAt && ` · decidida em ${formatCallDate(application.decidedAt)}`}
              </p>

              {application.status === 'PENDING' && (
                <DecideApplicationButtons callId={callId} applicationId={application.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}