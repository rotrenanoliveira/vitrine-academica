import type { Event } from '@/utils/type'

export const phaseLabels: Record<Event['phase'], string> = {
  THEME_SELECTION: 'Escolha de tema',
  INSTITUTIONAL_SELECTION: 'Seleção institucional',
  OPEN: 'Aberto',
  CLOSED: 'Encerrado',
}

export function eventHref(event: Event) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return `/eventos/${event.slug}/escolha`
    case 'INSTITUTIONAL_SELECTION':
      return `/eventos/${event.slug}`
    default:
      return `/eventos/${event.slug}`
  }
}

export function eventActionLabel(event: Event) {
  switch (event.phase) {
    case 'THEME_SELECTION':
      return 'Participar da escolha'
    case 'INSTITUTIONAL_SELECTION':
      return 'Aguardando tema'
    default:
      return 'Ver detalhes'
  }
}
