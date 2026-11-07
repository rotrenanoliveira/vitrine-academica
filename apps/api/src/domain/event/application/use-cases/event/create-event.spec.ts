import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { EventPhase, ParticipationScope } from '../../../enterprise/entities/event'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { CreateEventUseCase } from './create-event'

let eventsRepository: InMemoryEventsRepository
let institutionsRepository: InMemoryInstitutionsRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: CreateEventUseCase

describe('(UC) - Create Event ', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    institutionsRepository = new InMemoryInstitutionsRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    const registerLog = new RegisterLogUseCase(new InMemoryAuditLogsRepository())
    sut = new CreateEventUseCase(eventsRepository, institutionsRepository, membersRepository, registerLog)
  })

  it('should be able to create an event', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const actorId = new UniqueEntityId().toString()
    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    membersRepository.items.push(member)

    const startsAt = new Date('2026-01-01T12:00:00.000Z')
    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
      participationScope: ParticipationScope.GLOBAL,
      startsAt,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.phase).toBe(EventPhase.THEME_SELECTION)
      expect(result.value.event.themeSelectionEndsAt.toISOString()).toBe('2026-01-08T12:00:00.000Z')
      expect(result.value.event.endsAt.toISOString()).toBe('2026-04-01T12:00:00.000Z')
      expect(result.value.event.isPubliclyListed()).toBe(false)
    }
  })

  it('should not be able to create an event without management role', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: new UniqueEntityId().toString(),
      participationScope: ParticipationScope.INSTITUTION,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(NotAllowedToManageEventError)
  })
})
