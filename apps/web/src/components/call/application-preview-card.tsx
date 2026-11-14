import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import type { CallApplicationWithCall } from '@/utils/call-type'
import { applicationStatusLabels, formatCallDate, getCallStatusLabel } from '@/utils/call-utils'

type ApplicationPreviewCardProps = {
  application: CallApplicationWithCall
}

export function ApplicationPreviewCard({ application }: ApplicationPreviewCardProps) {
  return (
    <BeigeActionCard
      title={
        <Link href={`/chamados/${application.call.id}`} className="underline-offset-4 hover:underline">
          {application.call.title}
        </Link>
      }
      meta={
        <>
          <p>{applicationStatusLabels[application.status]}</p>
          <p>Chamado {getCallStatusLabel(application.call)}</p>
          <p>Enviada em {formatCallDate(application.createdAt)}</p>
        </>
      }
      description={application.message ? <p className="line-clamp-3">{application.message}</p> : <p>Sem mensagem.</p>}
    />
  )
}
