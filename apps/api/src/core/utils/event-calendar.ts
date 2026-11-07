import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const THEME_SELECTION_DAYS = 7
const EVENT_DURATION_MONTHS = 3

export function computeThemeSelectionEndsAt(startsAt: Date) {
  return dayjs.utc(startsAt).add(THEME_SELECTION_DAYS, 'day').toDate()
}

export function computeEventEndsAt(startsAt: Date) {
  return dayjs.utc(startsAt).add(EVENT_DURATION_MONTHS, 'month').toDate()
}

export function buildEventWindow(startsAt: Date) {
  return {
    startsAt,
    themeSelectionEndsAt: computeThemeSelectionEndsAt(startsAt),
    endsAt: computeEventEndsAt(startsAt),
  }
}
