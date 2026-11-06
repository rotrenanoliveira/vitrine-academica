import type { DailyCount, LabelCount } from '../repositories/analytics-repository'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export function periodStart(days: number, now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - (days - 1))

  return start
}

export function fillDailySeries(rows: DailyCount[], days: number, now = new Date()): DailyCount[] {
  const totals = new Map(rows.map((row) => [row.date, row.total]))
  const start = periodStart(days, now)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_IN_MS).toISOString().slice(0, 10)

    return { date, total: totals.get(date) ?? 0 }
  })
}

export function fillLabelCounts(rows: LabelCount[], labels: string[]): LabelCount[] {
  const totals = new Map(rows.map((row) => [row.label, row.total]))

  return labels.map((label) => ({ label, total: totals.get(label) ?? 0 }))
}

export function sumTotals(items: { total: number }[]) {
  return items.reduce((sum, item) => sum + item.total, 0)
}
