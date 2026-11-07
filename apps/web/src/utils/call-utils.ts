import type { CallApplicationStatus, CallWithSkills } from './call-type'
import type { InstitutionMemberRole } from './type'

const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/
const BRASILIA_OFFSET = '-03:00'
const BRASILIA_OFFSET_IN_MS = 3 * 60 * 60 * 1000

type CallState = Pick<CallWithSkills, 'status' | 'applicationDeadline'>

export function parseDateTimeLocalValue(value: string) {
  if (!DATE_TIME_LOCAL_PATTERN.test(value)) return null

  const normalized = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${normalized}${BRASILIA_OFFSET}`)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export function toDateTimeLocalValue(iso: string) {
  return new Date(new Date(iso).getTime() - BRASILIA_OFFSET_IN_MS).toISOString().slice(0, 16)
}

export function formatCallDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })
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

export const memberRoleLabels: Record<InstitutionMemberRole, string> = {
  STUDENT: 'Aluno',
  PROFESSOR: 'Professor',
  TEACHER: 'Docente',
  MANAGER: 'Gestor',
  ADMINISTRATIVE_OFFICE: 'Secretaria',
}