import { buildEventWindow, computeEventEndsAt, computeThemeSelectionEndsAt } from './event-calendar'

describe('event-calendar', () => {
  it('should be able to compute theme selection end after 7 days', () => {
    const startsAt = new Date('2026-01-01T15:00:00.000Z')

    expect(computeThemeSelectionEndsAt(startsAt).toISOString()).toBe('2026-01-08T15:00:00.000Z')
  })

  it('should be able to compute event end after 3 calendar months', () => {
    const startsAt = new Date('2026-01-15T12:00:00.000Z')

    expect(computeEventEndsAt(startsAt).toISOString()).toBe('2026-04-15T12:00:00.000Z')
  })

  it('should be able to create the full event date', () => {
    const startsAt = new Date('2026-03-01T00:00:00.000Z')
    const window = buildEventWindow(startsAt)

    expect(window.startsAt).toBe(startsAt)
    expect(window.themeSelectionEndsAt.toISOString()).toBe('2026-03-08T00:00:00.000Z')
    expect(window.endsAt.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })
})
