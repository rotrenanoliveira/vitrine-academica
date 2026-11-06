import { makeEvent } from '@tests/factories/make-event'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { EditEventNameUseCase } from './edit-event-name'

let eventsRepository: InMemoryEventsRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: EditEventNameUseCase

describe('(UC) - Edit Event Name', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new EditEventNameUseCase(
      eventsRepository,
      membersRepository,
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to rename an event', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId, name: 'Nome antigo' })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const result = await sut.execute({
      eventId: event.id.toString(),
      actorId,
      name: 'Nome novo',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.name).toBe('Nome novo')
    }
  })

  it('should not be able to rename when event is missing or actor permission', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    const missing = await sut.execute({
      eventId: new UniqueEntityId().toString(),
      actorId,
      name: 'John Doe',
    })

    const forbidden = await sut.execute({
      eventId: event.id.toString(),
      actorId,
      name: 'John Doe',
    })

    expect(missing.value).toBeInstanceOf(EventNotFoundError)
    expect(forbidden.value).toBeInstanceOf(NotAllowedToManageEventError)
  })
})
