import { makeEvent } from '@tests/factories/make-event'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { GetPublicEventUseCase } from './get-public-event'

let eventsRepository: InMemoryEventsRepository
let sut: GetPublicEventUseCase

describe('(UC) - Get Public Event', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    sut = new GetPublicEventUseCase(eventsRepository)
  })

  it('should be able to get a publicly listed event', async () => {
    const { event } = makeEvent({ slug: 'mostra-umc', startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const byId = await sut.execute({ eventId: event.id.toString() })
    const bySlug = await sut.execute({ eventSlug: 'mostra-umc' })

    expect(byId.isRight()).toBeTruthy()
    expect(bySlug.isRight()).toBeTruthy()

    if (byId.isRight() && bySlug.isRight()) {
      expect(byId.value.event.id.toString()).toBe(event.id.toString())
      expect(bySlug.value.event.id.toString()).toBe(event.id.toString())
    }
  })

  it('should not be able to get a non-public or missing event', async () => {
    const { event } = makeEvent()
    eventsRepository.items.push(event)

    const privateEvent = await sut.execute({ eventId: event.id.toString() })
    const missing = await sut.execute({ eventId: new UniqueEntityId().toString() })
    const empty = await sut.execute({})

    expect(privateEvent.value).toBeInstanceOf(EventNotFoundError)
    expect(missing.value).toBeInstanceOf(EventNotFoundError)
    expect(empty.value).toBeInstanceOf(EventNotFoundError)
  })
})
