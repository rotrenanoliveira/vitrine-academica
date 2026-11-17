import { type Either, right } from '@/core/either'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { EventRegistration } from '../../../enterprise/entities/event-registration'
import type { EventRegistrationWithContext } from '../../dtos/event-registration-with-context'
import type { EventRegistrationsRepository } from '../../repositories/event-registrations-repository'
import type { EventsRepository } from '../../repositories/events-repository'

interface FetchMyEventRegistrationsUseCaseRequest {
  userId: string
}

type FetchMyEventRegistrationsUseCaseResponse = Either<never, { registrations: EventRegistrationWithContext[] }>

export class FetchMyEventRegistrationsUseCase {
  constructor(
    private readonly eventRegistrationsRepository: EventRegistrationsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async execute({
    userId,
  }: FetchMyEventRegistrationsUseCaseRequest): Promise<FetchMyEventRegistrationsUseCaseResponse> {
    const registrations = await this.eventRegistrationsRepository.findManyByResponsibleUserId(userId)

    if (registrations.length === 0) {
      return right({ registrations: [] })
    }

    const registrationsWithContext = await this.buildRegistrationsWithContext(registrations)

    return right({ registrations: registrationsWithContext })
  }

  private async buildRegistrationsWithContext(
    registrations: EventRegistration[],
  ): Promise<EventRegistrationWithContext[]> {
    const eventIds = [...new Set(registrations.map((registration) => registration.eventId.toString()))]
    const projectIds = [...new Set(registrations.map((registration) => registration.projectId.toString()))]
    const [events, projects] = await Promise.all([
      this.eventsRepository.findManyByIds(eventIds),
      this.projectsRepository.findManyByIds(projectIds),
    ])
    const eventsById = new Map(events.map((event) => [event.id.toString(), event]))
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    return registrations.flatMap((registration) => {
      const event = eventsById.get(registration.eventId.toString())
      const project = projectsById.get(registration.projectId.toString())

      if (!event || !project) {
        return []
      }

      return [{ registration, event, project }]
    })
  }
}
