import { makeEvent } from '@tests/factories/make-event'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventPhase } from '../../../enterprise/entities/event'
import { FetchPublicEventsUseCase } from './fetch-public-events'

let eventsRepository: InMemoryEventsRepository
let sut: FetchPublicEventsUseCase

describe('(UC) - Fetch Public Events', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    sut = new FetchPublicEventsUseCase(eventsRepository)
  })

  it('should be able to list events', async () => {
    const institutionId = new UniqueEntityId()

    const { event: themeSelection } = makeEvent({ institutionId })
    const { event: open } = makeEvent({ institutionId, startsAt: new Date('2026-02-01T12:00:00.000Z') })
    open.closeThemeVoting()
    open.selectWinnerTheme(new UniqueEntityId('theme-1'))

    const { event: otherInstitution } = makeEvent({
      institutionId: new UniqueEntityId(),
      startsAt: new Date('2026-03-01T12:00:00.000Z'),
    })
    otherInstitution.closeThemeVoting()
    otherInstitution.selectWinnerTheme(new UniqueEntityId('theme-2'))

    eventsRepository.items.push(themeSelection, open, otherInstitution)

    const all = await sut.execute()
    const filtered = await sut.execute({
      institutionId: institutionId.toString(),
      phase: EventPhase.OPEN,
    })

    expect(all.isRight()).toBeTruthy()

    if (all.isRight()) {
      expect(all.value.events).toHaveLength(3)
    }

    expect(filtered.isRight()).toBeTruthy()

    if (filtered.isRight()) {
      expect(filtered.value.events).toHaveLength(1)
      expect(filtered.value.events[0].id.toString()).toBe(open.id.toString())
    }
  })
})
