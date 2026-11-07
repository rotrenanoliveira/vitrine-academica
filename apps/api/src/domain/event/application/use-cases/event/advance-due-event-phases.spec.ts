import { makeEvent } from '@tests/factories/make-event'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { EventPhase } from '../../../enterprise/entities/event'
import { AdvanceDueEventPhasesUseCase } from './advance-due-event-phases'

let eventsRepository: InMemoryEventsRepository
let sut: AdvanceDueEventPhasesUseCase

describe('(UC) - Advance Due Event Phases', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    sut = new AdvanceDueEventPhasesUseCase(eventsRepository, new RegisterLogUseCase(new InMemoryAuditLogsRepository()))
  })

  it('should be able to change event from THEME_SELECTION to INSTITUTIONAL_SELECTION ', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    eventsRepository.items.push(event)

    const now = new Date('2026-01-09T12:00:00.000Z')
    const first = await sut.execute({ now })
    const second = await sut.execute({ now })

    expect(first.isRight()).toBeTruthy()
    if (first.isRight()) {
      expect(first.value.closedThemeSelection).toHaveLength(1)
      expect(first.value.closedThemeSelection[0].phase).toBe(EventPhase.INSTITUTIONAL_SELECTION)
    }
    if (second.isRight()) {
      expect(second.value.closedThemeSelection).toHaveLength(0)
    }
  })

  it('should be able to close OPEN events after endsAt', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const now = new Date('2026-04-02T12:00:00.000Z')
    const result = await sut.execute({ now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.closedEvents).toHaveLength(1)
      expect(result.value.closedEvents[0].phase).toBe(EventPhase.CLOSED)
    }
  })
})
