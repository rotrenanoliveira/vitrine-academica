import { makeEvent } from '@tests/factories/make-event'
import { makeEventRegistration } from '@tests/factories/make-event-registration'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryEventRegistrationsRepository } from '@tests/repositories/in-memory-event-registrations-repository'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchMyEventRegistrationsUseCase } from './fetch-my-event-registrations'

let eventsRepository: InMemoryEventsRepository
let eventRegistrationsRepository: InMemoryEventRegistrationsRepository
let projectsRepository: InMemoryProjectsRepository
let sut: FetchMyEventRegistrationsUseCase

describe('(UC) - Fetch My Event Registrations', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    eventRegistrationsRepository = new InMemoryEventRegistrationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    sut = new FetchMyEventRegistrationsUseCase(eventRegistrationsRepository, eventsRepository, projectsRepository)
  })

  it('should return only my registrations with the event and project, newest first', async () => {
    const userId = new UniqueEntityId()
    const { event: firstEvent } = makeEvent({ name: 'Primeiro evento', slug: 'primeiro-evento' })
    const { event: secondEvent } = makeEvent({ name: 'Segundo evento', slug: 'segundo-evento' })
    const { event: otherEvent } = makeEvent({ name: 'Evento de outra pessoa', slug: 'evento-de-outra-pessoa' })
    const { project: olderProject } = makeProject({ title: 'Projeto antigo', slug: 'projeto-antigo' })
    const { project: newerProject } = makeProject({ title: 'Projeto novo', slug: 'projeto-novo' })
    const { project: someoneElseProject } = makeProject({ title: 'Projeto alheio', slug: 'projeto-alheio' })
    const { registration: older } = makeEventRegistration({
      eventId: firstEvent.id,
      projectId: olderProject.id,
      responsibleUserId: userId,
      registeredAt: new Date('2026-01-01T00:00:00Z'),
    })
    const { registration: newer } = makeEventRegistration({
      eventId: secondEvent.id,
      projectId: newerProject.id,
      responsibleUserId: userId,
      registeredAt: new Date('2026-02-01T00:00:00Z'),
    })
    const { registration: someoneElse } = makeEventRegistration({
      eventId: otherEvent.id,
      projectId: someoneElseProject.id,
    })

    eventsRepository.items.push(firstEvent, secondEvent, otherEvent)
    projectsRepository.items.push(olderProject, newerProject, someoneElseProject)
    eventRegistrationsRepository.items.push(older, newer, someoneElse)

    const result = await sut.execute({ userId: userId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.registrations.map(({ registration }) => registration.id.toString())).toEqual([
        newer.id.toString(),
        older.id.toString(),
      ])
      expect(result.value.registrations.map(({ event }) => event.name)).toEqual(['Segundo evento', 'Primeiro evento'])
      expect(result.value.registrations.map(({ project }) => project.title)).toEqual(['Projeto novo', 'Projeto antigo'])
    }
  })

  it('should return an empty list when the user has no registrations', async () => {
    const result = await sut.execute({ userId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.registrations).toEqual([])
    }
  })
})
