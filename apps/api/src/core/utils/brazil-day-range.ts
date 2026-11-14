const BRAZIL_UTC_OFFSET_IN_HOURS = 3
const HOUR_IN_MS = 60 * 60 * 1000

export function brazilDayRange(date: Date) {
  const shifted = new Date(date.getTime() - BRAZIL_UTC_OFFSET_IN_HOURS * HOUR_IN_MS)

  const start = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), BRAZIL_UTC_OFFSET_IN_HOURS),
  )
  const end = new Date(start.getTime() + 24 * HOUR_IN_MS)

  return { start, end }
}
