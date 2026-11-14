import { makeEvent } from '@tests/factories/make-event'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ParticipationScope } from '../../../enterprise/entities/event'
import { ThemeStatus } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { SuggestThemeUseCase } from './suggest-theme'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: SuggestThemeUseCase

describe('(UC) - Suggest Theme', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new SuggestThemeUseCase(
      eventsRepository,
      themesRepository,
      membersRepository,
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to suggest a pending theme while selection is open', async () => {
    const { event } = makeEvent({
      participationScope: ParticipationScope.GLOBAL,
      startsAt: new Date('2026-01-01T12:00:00.000Z'),
    })
    eventsRepository.items.push(event)

    const authorId = new UniqueEntityId().toString()
    const result = await sut.execute({
      eventId: event.id.toString(),
      authorId,
      title: 'Sustentabilidade urbana',
      description: 'Propostas para cidades mais verdes',
      now: new Date('2026-01-03T12:00:00.000Z'),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.theme.status).toBe(ThemeStatus.PENDING)
      expect(result.value.theme.title).toBe('Sustentabilidade urbana')
      expect(themesRepository.items).toHaveLength(1)
    }
  })

  it('should not be able to suggest when missing, ineligible or after window', async () => {
    const { event: institutionOnly } = makeEvent({
      participationScope: ParticipationScope.INSTITUTION,
      startsAt: new Date('2026-01-01T12:00:00.000Z'),
    })
    const { event: openEvent } = makeEvent({
      participationScope: ParticipationScope.GLOBAL,
      startsAt: new Date('2026-01-01T12:00:00.000Z'),
    })
    eventsRepository.items.push(institutionOnly, openEvent)

    const authorId = new UniqueEntityId().toString()

    const missing = await sut.execute({
      eventId: new UniqueEntityId().toString(),
      authorId,
      title: 'Tema',
      description: 'Descrição',
      now: new Date('2026-01-03T12:00:00.000Z'),
    })

    const ineligible = await sut.execute({
      eventId: institutionOnly.id.toString(),
      authorId,
      title: 'Tema',
      description: 'Descrição',
      now: new Date('2026-01-03T12:00:00.000Z'),
    })

    const closed = await sut.execute({
      eventId: openEvent.id.toString(),
      authorId,
      title: 'Tema',
      description: 'Descrição',
      now: new Date('2026-01-10T12:00:00.000Z'),
    })

    expect(missing.value).toBeInstanceOf(EventNotFoundError)
    expect(ineligible.value).toBeInstanceOf(NotEligibleForEventError)
    expect(closed.value).toBeInstanceOf(EventWindowClosedError)
  })
})
