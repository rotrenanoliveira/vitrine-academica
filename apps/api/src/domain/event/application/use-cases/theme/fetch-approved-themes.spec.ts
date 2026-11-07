import { makeEvent } from '@tests/factories/make-event'
import { makeTheme } from '@tests/factories/make-theme'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { ThemeStatus } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { FetchApprovedThemesUseCase } from './fetch-approved-themes'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let sut: FetchApprovedThemesUseCase

describe('(UC) - Fetch Approved Themes', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    sut = new FetchApprovedThemesUseCase(eventsRepository, themesRepository)
  })

  it('should be able to list only approved themes for an event', async () => {
    const { event } = makeEvent()
    eventsRepository.items.push(event)

    const { theme: approved } = makeTheme({ eventId: event.id, status: ThemeStatus.APPROVED })
    const { theme: pending } = makeTheme({ eventId: event.id, status: ThemeStatus.PENDING })
    themesRepository.items.push(approved, pending)

    const result = await sut.execute({ eventId: event.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.themes).toHaveLength(1)
      expect(result.value.themes[0].id.toString()).toBe(approved.id.toString())
    }
  })

  it('should not be able to list themes of a missing event', async () => {
    const result = await sut.execute({ eventId: 'invalid-theme-id' })

    expect(result.value).toBeInstanceOf(EventNotFoundError)
  })
})
