import { makeEvent } from '@tests/factories/make-event'
import { makeEventRegistration } from '@tests/factories/make-event-registration'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryEventRegistrationsRepository } from '@tests/repositories/in-memory-event-registrations-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { FetchApprovedParticipantsUseCase } from './fetch-approved-participants'

let eventsRepository: InMemoryEventsRepository
let registrationsRepository: InMemoryEventRegistrationsRepository
let projectsRepository: InMemoryProjectsRepository
let sut: FetchApprovedParticipantsUseCase

describe('(UC) - Fetch Approved Participants', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    registrationsRepository = new InMemoryEventRegistrationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    sut = new FetchApprovedParticipantsUseCase(eventsRepository, registrationsRepository, projectsRepository)
  })

  it('should be able to list approved projects for an event', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const { project: approved } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: pending } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(approved, pending)

    const approvedRegistration = makeEventRegistration({
      eventId: event.id,
      projectId: approved.id,
      status: EventRegistrationStatus.APPROVED,
    }).registration
    const pendingRegistration = makeEventRegistration({
      eventId: event.id,
      projectId: pending.id,
      status: EventRegistrationStatus.PENDING,
    }).registration
    registrationsRepository.items.push(approvedRegistration, pendingRegistration)

    const result = await sut.execute({ eventId: event.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(approved.id.toString())
    }
  })
})
