import { makeEvent } from '@tests/factories/make-event'
import { makeEventRegistration } from '@tests/factories/make-event-registration'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryEventRegistrationsRepository } from '@tests/repositories/in-memory-event-registrations-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { FetchEventRegistrationsUseCase } from './fetch-event-registrations'

let eventsRepository: InMemoryEventsRepository
let registrationsRepository: InMemoryEventRegistrationsRepository
let projectsRepository: InMemoryProjectsRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: FetchEventRegistrationsUseCase

function openEvent(institutionId: UniqueEntityId) {
  const { event } = makeEvent({ institutionId, startsAt: new Date('2026-01-01T12:00:00.000Z') })
  event.closeThemeVoting()
  event.selectWinnerTheme(new UniqueEntityId('theme-1'))
  eventsRepository.items.push(event)
  return event
}

describe('(UC) - Fetch Event Registrations', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    registrationsRepository = new InMemoryEventRegistrationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new FetchEventRegistrationsUseCase(
      eventsRepository,
      registrationsRepository,
      projectsRepository,
      membersRepository,
    )
  })

  it('should be able to list pending registrations', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()
    const event = openEvent(institutionId)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const { project: pendingProject } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: approvedProject } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(pendingProject, approvedProject)

    registrationsRepository.items.push(
      makeEventRegistration({
        eventId: event.id,
        projectId: pendingProject.id,
        status: EventRegistrationStatus.PENDING,
      }).registration,
      makeEventRegistration({
        eventId: event.id,
        projectId: approvedProject.id,
        status: EventRegistrationStatus.APPROVED,
      }).registration,
    )

    const result = await sut.execute({
      eventId: event.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.registrations).toHaveLength(1)
      expect(result.value.registrations[0].projectId.toString()).toBe(pendingProject.id.toString())
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(pendingProject.id.toString())
    }
  })

  it('should not be able to list registrations without permission', async () => {
    const institutionId = new UniqueEntityId()
    const event = openEvent(institutionId)

    const result = await sut.execute({
      eventId: event.id.toString(),
      actorId: 'invalid-actor-id',
    })

    expect(result.value).toBeInstanceOf(NotAllowedToManageEventError)
  })
})
