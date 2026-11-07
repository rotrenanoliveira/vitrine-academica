import { makeEvent } from '@tests/factories/make-event'
import { makeTheme } from '@tests/factories/make-theme'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { InMemoryVotesRepository } from '@tests/repositories/in-memory-votes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ThemeStatus } from '../../../enterprise/entities/theme'
import { DuplicateVoteError } from '../../_errors/duplicate-vote-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { VoteThemeUseCase } from './vote-theme'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let votesRepository: InMemoryVotesRepository
let sut: VoteThemeUseCase

describe('(UC) - Vote Theme', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    votesRepository = new InMemoryVotesRepository()
    sut = new VoteThemeUseCase(
      eventsRepository,
      themesRepository,
      votesRepository,
      new InMemoryInstitutionMembersRepository(),
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to vote once on an approved theme', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({
      eventId: event.id,
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(theme)

    const userId = new UniqueEntityId().toString()
    const now = new Date('2026-01-03T12:00:00.000Z')

    const first = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      userId,
      now,
    })
    const second = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      userId,
      now,
    })

    expect(first.isRight()).toBeTruthy()
    expect(second.isLeft()).toBeTruthy()
    expect(second.value).toBeInstanceOf(DuplicateVoteError)
  })

  it('should not be able to vote on unapproved theme', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({ eventId: event.id, status: ThemeStatus.PENDING })
    themesRepository.items.push(theme)

    const pending = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      userId: new UniqueEntityId().toString(),
      now: new Date('2026-01-03T12:00:00.000Z'),
    })

    theme.approve(new UniqueEntityId())
    await themesRepository.save(theme)

    const closed = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      userId: new UniqueEntityId().toString(),
      now: new Date('2026-01-10T12:00:00.000Z'),
    })

    expect(pending.value).toBeInstanceOf(InvalidThemeError)
    expect(closed.value).toBeInstanceOf(EventWindowClosedError)
  })

  it('should not be able to vote after early theme selection', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    const { theme } = makeTheme({
      eventId: event.id,
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(theme)

    event.selectWinnerTheme(theme.id)
    eventsRepository.items.push(event)

    const result = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      userId: new UniqueEntityId().toString(),
      now: new Date('2026-01-03T12:00:00.000Z'),
    })

    expect(result.value).toBeInstanceOf(EventWindowClosedError)
  })
})
