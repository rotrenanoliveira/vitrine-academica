const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/
const BRASILIA_OFFSET = '-03:00'
const BRASILIA_OFFSET_IN_MS = 3 * 60 * 60 * 1000
const BRASILIA_TIME_ZONE = 'America/Sao_Paulo'

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

export function formatBrasiliaDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: BRASILIA_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function formatBrasiliaDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIME_ZONE,
  })
}
