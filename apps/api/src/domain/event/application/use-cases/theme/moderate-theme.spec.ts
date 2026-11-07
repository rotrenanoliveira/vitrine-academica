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
import { ThemeStatus } from '../../../enterprise/entities/theme'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { ModerateThemeUseCase } from './moderate-theme'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: ModerateThemeUseCase

describe('(UC) - Moderate Theme', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new ModerateThemeUseCase(
      eventsRepository,
      themesRepository,
      membersRepository,
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to approve a theme', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
      }).member,
    )

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      themeId: theme.id.toString(),
      actorId,
      action: 'APPROVE',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.theme.status).toBe(ThemeStatus.APPROVED)
    }
  })

  it('should be able to reject a theme', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
      }).member,
    )

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      themeId: theme.id.toString(),
      actorId,
      action: 'REJECT',
      reason: 'Fora do escopo',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.theme.status).toBe(ThemeStatus.REJECTED)
    }
  })

  it('should be able to hide a theme', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
      }).member,
    )

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      themeId: theme.id.toString(),
      actorId,
      action: 'HIDE',
      reason: 'Duplicado',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.theme.status).toBe(ThemeStatus.HIDDEN)
    }
  })

  it('should not be able to reject without reason', async () => {
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

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      themeId: theme.id.toString(),
      actorId,
      action: 'REJECT',
    })

    expect(result.value).toBeInstanceOf(InvalidThemeError)
  })

  it('should not be able to moderate without permission', async () => {
    const institutionId = new UniqueEntityId()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      themeId: theme.id.toString(),
      actorId: new UniqueEntityId().toString(),
      action: 'APPROVE',
    })

    expect(result.value).toBeInstanceOf(NotAllowedToManageEventError)
  })

  it('should not be able to moderate a non-existent theme', async () => {
    const actorId = new UniqueEntityId().toString()

    const result = await sut.execute({
      themeId: 'invalid-id',
      actorId,
      action: 'APPROVE',
    })

    expect(result.value).toBeInstanceOf(InvalidThemeError)
  })
})
