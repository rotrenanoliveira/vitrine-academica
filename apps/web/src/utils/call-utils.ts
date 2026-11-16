import type { CallApplicationStatus, CallWithSkills } from './call-type'
import { formatBrasiliaDateTime } from './date-time'

export { parseDateTimeLocalValue, toDateTimeLocalValue } from './date-time'

type CallState = Pick<CallWithSkills, 'status' | 'applicationDeadline'>

export function formatCallDate(iso: string) {
  return formatBrasiliaDateTime(iso)
}

export function isCallExpired(applicationDeadline: string, now = new Date()) {
  return now >= new Date(applicationDeadline)
}

export function isCallAcceptingApplications(call: CallState, now = new Date()) {
  return call.status === 'OPEN' && !isCallExpired(call.applicationDeadline, now)
}

export function getCallStatusLabel(call: CallState, now = new Date()) {
  if (call.status === 'CLOSED') return 'Encerrado'
  if (isCallExpired(call.applicationDeadline, now)) return 'Prazo encerrado'

  return 'Aberto'
}

export const applicationStatusLabels: Record<CallApplicationStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
}
