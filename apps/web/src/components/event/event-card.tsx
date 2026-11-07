import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Event } from '@/utils/type'

const phaseLabels: Record<Event['phase'], string> = {
  THEME_SELECTION: 'Escolha de tema',
  INSTITUTIONAL_SELECTION: 'Seleção institucional',
  OPEN: 'Aberto',
  CLOSED: 'Encerrado',
}

function eventHref(event: Event) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return `/eventos/${event.slug}/escolha`
    case 'INSTITUTIONAL_SELECTION':
      return `/eventos/${event.slug}`
    default:
      return `/eventos/${event.slug}`
  }
}

function eventActionLabel(event: Event) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return 'Participar da escolha'
    case 'INSTITUTIONAL_SELECTION':
      return 'Aguardando tema'
    default:
      return 'Ver detalhes'
  }
}

export function EventCard({ event, canManage = false }: { event: Event; canManage?: boolean }) {
  const href = eventHref(event)
  const label = eventActionLabel(event)
  const isWaiting = event.phase === 'INSTITUTIONAL_SELECTION'
  const editHref = `/eventos/${event.slug}/editar`

  return (
    <article className="flex flex-col gap-2 border-b border-border py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium">{event.name ?? event.slug}</h2>
        <span className="text-muted-foreground text-sm">{phaseLabels[event.phase]}</span>
      </div>
      <p className="text-muted-foreground text-sm">
        De {new Date(event.startsAt).toLocaleDateString('pt-BR')} até{' '}
        {new Date(event.endsAt).toLocaleDateString('pt-BR')}
      </p>
      <div className="flex flex-wrap gap-2">
        {isWaiting ? (
          <p className="text-muted-foreground self-center text-sm">{label}</p>
        ) : (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href} />}>
            {label}
          </Button>
        )}
        {canManage && (
          <Button size="sm" nativeButton={false} render={<Link href={editHref} />}>
            Editar
          </Button>
        )}
      </div>
    </article>
  )
}
