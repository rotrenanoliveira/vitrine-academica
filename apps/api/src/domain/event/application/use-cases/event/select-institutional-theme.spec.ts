import { makeEvent } from '@tests/factories/make-event'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeTheme } from '@tests/factories/make-theme'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { EventPhase } from '../../../enterprise/entities/event'
import { ThemeStatus } from '../../../enterprise/entities/theme'
import { InvalidEventPhaseError } from '../../_errors/invalid-event-phase-error'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { SelectInstitutionalThemeUseCase } from './select-institutional-theme'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: SelectInstitutionalThemeUseCase

describe('(UC) - Select Institutional Theme', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new SelectInstitutionalThemeUseCase(
      eventsRepository,
      themesRepository,
      membersRepository,
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to select approved theme', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })

    event.closeThemeVoting()
    eventsRepository.items.push(event)

    const { member } = makeInstitutionMember({
      institutionId: institutionId.toString(),
      userId: actorId,
      role: InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
    })
    membersRepository.items.push(member)

    const { theme } = makeTheme({
      eventId: event.id,
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.phase).toBe(EventPhase.OPEN)
      expect(result.value.event.winnerThemeId?.toString()).toBe(theme.id.toString())
      expect(result.value.event.isPubliclyListed()).toBe(true)
    }
  })

  it('should be able to select an approved theme early', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const { theme } = makeTheme({
      eventId: event.id,
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.phase).toBe(EventPhase.OPEN)
      expect(result.value.event.winnerThemeId?.toString()).toBe(theme.id.toString())
      expect(result.value.event.isAcceptingVotes()).toBe(false)
    }
  })

  it('should not be able to select an unapproved theme', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()

    const { event } = makeEvent({ institutionId })
    event.closeThemeVoting()
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const { theme } = makeTheme({ eventId: event.id, status: ThemeStatus.PENDING })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      actorId,
    })

    expect(result.value).toBeInstanceOf(InvalidThemeError)
  })

  it('should not be able to select a theme after the event is already open', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()

    const { event } = makeEvent({ institutionId })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const { theme } = makeTheme({
      eventId: event.id,
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: event.id.toString(),
      themeId: theme.id.toString(),
      actorId,
    })

    expect(result.value).toBeInstanceOf(InvalidEventPhaseError)
  })
})
