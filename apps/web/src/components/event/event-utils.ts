import type { Event, EventListItem, EventPhase } from '@/utils/type'

type EventLinkFields = Pick<Event | EventListItem, 'slug' | 'phase'>

export const phaseLabels: Record<EventPhase, string> = {
  THEME_SELECTION: 'Escolha de tema',
  INSTITUTIONAL_SELECTION: 'Seleção institucional',
  OPEN: 'Aberto',
  CLOSED: 'Encerrado',
}

export function eventHref(event: EventLinkFields) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return `/eventos/${event.slug}/escolha`
    case 'INSTITUTIONAL_SELECTION':
      return `/eventos/${event.slug}`
    default:
      return `/eventos/${event.slug}`
  }
}

export function eventActionLabel(event: EventLinkFields) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return 'Participar da escolha'
    case 'INSTITUTIONAL_SELECTION':
      return 'Aguardando tema'
    default:
      return 'Ver detalhes'
  }
}
