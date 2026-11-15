import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import type { EventRegistrationWithContext } from '@/utils/type'
import { eventRegistrationStatusLabels, phaseLabels } from './event-utils'

type EventRegistrationPreviewCardProps = {
  registration: EventRegistrationWithContext
}

export function EventRegistrationPreviewCard({ registration }: EventRegistrationPreviewCardProps) {
  const eventName = registration.event.name ?? 'Evento sem nome'

  return (
    <BeigeActionCard
      title={
        <Link href={`/eventos/${registration.event.slug}`} className="underline-offset-4 hover:underline">
          {eventName}
        </Link>
      }
      meta={
        <>
          <p>{eventRegistrationStatusLabels[registration.status]}</p>
          <p>Evento {phaseLabels[registration.event.phase]}</p>
          <p>Inscrito em {new Date(registration.registeredAt).toLocaleDateString('pt-BR')}</p>
        </>
      }
      description={
        <p className="line-clamp-3">
          Projeto{' '}
          <Link href={`/projetos/${registration.project.slug}`} className="underline-offset-4 hover:underline">
            {registration.project.title}
          </Link>
        </p>
      }
    />
  )
}
