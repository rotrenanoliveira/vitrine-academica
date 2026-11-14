import { makeEvent } from '@tests/factories/make-event'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryEventRegistrationsRepository } from '@tests/repositories/in-memory-event-registrations-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { DuplicateRegistrationError } from '../../_errors/duplicate-registration-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { ProjectNotPublishedError } from '../../_errors/project-not-published-error'
import { RegisterProjectInEventUseCase } from './register-project-in-event'

let eventsRepository: InMemoryEventsRepository
let registrationsRepository: InMemoryEventRegistrationsRepository
let projectsRepository: InMemoryProjectsRepository
let sut: RegisterProjectInEventUseCase

describe('(UC) - Register Project In Event', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    registrationsRepository = new InMemoryEventRegistrationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    sut = new RegisterProjectInEventUseCase(
      eventsRepository,
      registrationsRepository,
      projectsRepository,
      new InMemoryInstitutionMembersRepository(),
      new RegisterLogUseCase(new InMemoryAuditLogsRepository()),
    )
  })

  it('should be able to register published project', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const authorId = new UniqueEntityId()

    const { project } = makeProject({ author: authorId, status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      eventId: event.id.toString(),
      projectId: project.id.toString(),
      userId: authorId.toString(),
      now: new Date('2026-02-01T12:00:00.000Z'),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.registration.status).toBe(EventRegistrationStatus.PENDING)
    }
  })

  it('should not be able to register a draft project', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const authorId = new UniqueEntityId()
    const { project } = makeProject({ author: authorId, status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      eventId: event.id.toString(),
      projectId: project.id.toString(),
      userId: authorId.toString(),
      now: new Date('2026-02-01T12:00:00.000Z'),
    })

    expect(result.value).toBeInstanceOf(ProjectNotPublishedError)
  })

  it('should not be able to register the same project twice', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const authorId = new UniqueEntityId()
    const { project } = makeProject({ author: authorId, status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    await sut.execute({
      eventId: event.id.toString(),
      projectId: project.id.toString(),
      userId: authorId.toString(),
      now: new Date('2026-02-01T12:00:00.000Z'),
    })

    const result = await sut.execute({
      eventId: event.id.toString(),
      projectId: project.id.toString(),
      userId: authorId.toString(),
      now: new Date('2026-02-01T12:00:00.000Z'),
    })

    expect(result.value).toBeInstanceOf(DuplicateRegistrationError)
  })

  it('should not be able to register after the event window is closed', async () => {
    const { event } = makeEvent({ startsAt: new Date('2026-01-01T12:00:00.000Z') })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const authorId = new UniqueEntityId()
    const { project } = makeProject({ author: authorId, status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      eventId: event.id.toString(),
      projectId: project.id.toString(),
      userId: authorId.toString(),
      now: new Date('2026-04-02T12:00:00.000Z'),
    })

    expect(result.value).toBeInstanceOf(EventWindowClosedError)
  })
})
