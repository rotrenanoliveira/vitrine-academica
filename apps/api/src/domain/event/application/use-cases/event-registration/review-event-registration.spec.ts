import { makeEvent } from '@tests/factories/make-event'
import { makeEventRegistration } from '@tests/factories/make-event-registration'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventRegistrationsRepository } from '@tests/repositories/in-memory-event-registrations-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { InvalidRegistrationStatusError } from '../../_errors/invalid-registration-status-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { ReviewEventRegistrationUseCase } from './review-event-registration'

let eventsRepository: InMemoryEventsRepository
let registrationsRepository: InMemoryEventRegistrationsRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: ReviewEventRegistrationUseCase

function setupManageableEvent(role = InstitutionMemberRole.MANAGER) {
  const institutionId = new UniqueEntityId()
  const actorId = new UniqueEntityId().toString()

  const { event } = makeEvent({ institutionId, startsAt: new Date('2026-01-01T12:00:00.000Z') })
  event.closeThemeVoting()
  event.selectWinnerTheme(new UniqueEntityId('theme-1'))
  eventsRepository.items.push(event)

  membersRepository.items.push(
    makeInstitutionMember({
      institutionId: institutionId.toString(),
      userId: actorId,
      role,
    }).member,
  )

  const { registration } = makeEventRegistration({ eventId: event.id })
  registrationsRepository.items.push(registration)

  return { actorId, registration }
}

describe('(UC) - Review Event Registration', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    registrationsRepository = new InMemoryEventRegistrationsRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new ReviewEventRegistrationUseCase(
      eventsRepository,
      registrationsRepository,
      membersRepository,
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to approve a pending registration', async () => {
    const { actorId, registration } = setupManageableEvent()

    const result = await sut.execute({
      registrationId: registration.id.toString(),
      actorId,
      action: 'APPROVE',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.registration.status).toBe(EventRegistrationStatus.APPROVED)
    }
  })

  it('should be able to reject a pending registration', async () => {
    const { actorId, registration } = setupManageableEvent()

    const result = await sut.execute({
      registrationId: registration.id.toString(),
      actorId,
      action: 'REJECT',
      reason: 'Projeto incompleto',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.registration.status).toBe(EventRegistrationStatus.REJECTED)
    }
  })

  it('should not be able to reject without a reason', async () => {
    const { actorId, registration } = setupManageableEvent(InstitutionMemberRole.ADMINISTRATIVE_OFFICE)

    const result = await sut.execute({
      registrationId: registration.id.toString(),
      actorId,
      action: 'REJECT',
    })

    expect(result.value).toBeInstanceOf(InvalidRegistrationStatusError)
  })

  it('should not be able to review the same registration twice', async () => {
    const { actorId, registration } = setupManageableEvent(InstitutionMemberRole.ADMINISTRATIVE_OFFICE)

    await sut.execute({
      registrationId: registration.id.toString(),
      actorId,
      action: 'APPROVE',
    })

    const result = await sut.execute({
      registrationId: registration.id.toString(),
      actorId,
      action: 'APPROVE',
    })

    expect(result.value).toBeInstanceOf(InvalidRegistrationStatusError)
  })

  it('should not be able to review without permission', async () => {
    const { registration } = setupManageableEvent(InstitutionMemberRole.ADMINISTRATIVE_OFFICE)

    const result = await sut.execute({
      registrationId: registration.id.toString(),
      actorId: 'invalid-actor-id',
      action: 'APPROVE',
    })

    expect(result.value).toBeInstanceOf(NotAllowedToManageEventError)
  })

  it('should not be able to review a missing registration', async () => {
    const { actorId } = setupManageableEvent(InstitutionMemberRole.ADMINISTRATIVE_OFFICE)

    const result = await sut.execute({
      registrationId: 'invalid-registration-id',
      actorId,
      action: 'APPROVE',
    })

    expect(result.value).toBeInstanceOf(InvalidRegistrationStatusError)
  })
})
