import { type Either, left, right } from '@/core/either'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { Event } from '../../../enterprise/entities/event'
import { type EventRegistration, EventRegistrationStatus } from '../../../enterprise/entities/event-registration'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventRegistrationsRepository } from '../../repositories/event-registrations-repository'
import type { EventsRepository } from '../../repositories/events-repository'

interface FetchEventRegistrationsUseCaseRequest {
  eventId: string
  actorId: string
  status?: EventRegistrationStatus
}

type FetchEventRegistrationsUseCaseResponse = Either<
  EventNotFoundError | NotAllowedToManageEventError,
  { registrations: EventRegistration[]; projects: Project[] }
>

export class FetchEventRegistrationsUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventRegistrationsRepository: EventRegistrationsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    eventId,
    actorId,
    status = EventRegistrationStatus.PENDING,
  }: FetchEventRegistrationsUseCaseRequest): Promise<FetchEventRegistrationsUseCaseResponse> {
    const access = await this.fetchEventAccess(eventId, actorId)

    if (access.isLeft()) {
      return left(access.value)
    }

    const { registrations, projects } = await this.fetchRegistrationsWithProjects(eventId, status)

    return right({ registrations, projects })
  }

  private async fetchEventAccess(
    eventId: string,
    actorId: string,
  ): Promise<Either<EventNotFoundError | NotAllowedToManageEventError, Event>> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      return left(new EventNotFoundError())
    }

    const canManage = await canManageInstitution(
      this.institutionMembersRepository,
      event.institutionId.toString(),
      actorId,
    )

    if (!canManage) {
      return left(new NotAllowedToManageEventError())
    }

    return right(event)
  }

  private async fetchRegistrationsWithProjects(eventId: string, status: EventRegistrationStatus) {
    const registrations = await this.eventRegistrationsRepository.findManyByEventId(eventId, status)
    const projectIds = registrations.map((registration) => registration.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    return { registrations, projects }
  }
}
