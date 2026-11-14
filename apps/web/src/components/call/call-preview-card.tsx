import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import type { CallWithSkills } from '@/utils/call-type'
import { formatCallDate, getCallStatusLabel } from '@/utils/call-utils'

type CallPreviewCardProps = {
  call: CallWithSkills
}

export function CallPreviewCard({ call }: CallPreviewCardProps) {
  return (
    <BeigeActionCard
      title={
        <Link href={`/chamados/${call.id}`} className="underline-offset-4 hover:underline">
          {call.title}
        </Link>
      }
      meta={
        <>
          <p>{getCallStatusLabel(call)}</p>
          <p>Prazo {formatCallDate(call.applicationDeadline)}</p>
        </>
      }
      description={<p className="line-clamp-3">{call.description}</p>}
    />
  )
}
