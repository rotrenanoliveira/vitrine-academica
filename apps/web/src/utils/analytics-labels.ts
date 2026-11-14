import type { LabelCount } from './analytics-type'

export const projectStatusLabels: Record<string, string> = {
  SKETCH: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
}

export const userStatusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
  BLOCKED: 'Bloqueado',
  DELETED: 'Excluído',
}

export const institutionStatusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
  ARCHIVED: 'Arquivada',
}

export const memberRoleLabels: Record<string, string> = {
  STUDENT: 'Aluno',
  PROFESSOR: 'Professor',
  TEACHER: 'Docente',
  MANAGER: 'Gestor',
  ADMINISTRATIVE_OFFICE: 'Secretaria',
}

export function toChartItems(labels: Record<string, string>, items: LabelCount[]) {
  return items.map((item) => ({ name: labels[item.label] ?? item.label, total: item.total }))
}
