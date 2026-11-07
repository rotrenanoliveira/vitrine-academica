import { type Either, left, right } from '@/core/either'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
import { EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import type { EventRegistrationsRepository } from '../../repositories/event-registrations-repository'
import type { EventsRepository } from '../../repositories/events-repository'

interface FetchApprovedParticipantsUseCaseRequest {
  eventId: string
}

type FetchApprovedParticipantsUseCaseResponse = Either<EventNotFoundError, { projects: Project[] }>

export class FetchApprovedParticipantsUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventRegistrationsRepository: EventRegistrationsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async execute({
    eventId,
  }: FetchApprovedParticipantsUseCaseRequest): Promise<FetchApprovedParticipantsUseCaseResponse> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event?.isPubliclyListed()) {
      return left(new EventNotFoundError())
    }

    const registrations = await this.eventRegistrationsRepository.findManyByEventId(
      eventId,
      EventRegistrationStatus.APPROVED,
    )

    const projectIds = registrations.map((registration) => registration.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    return right({ projects })
  }
}
