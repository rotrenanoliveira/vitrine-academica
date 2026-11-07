import { type Either, left, right } from '@/core/either'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
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

    const registrations = await this.eventRegistrationsRepository.findManyByEventId(eventId, status)
    const projectIds = registrations.map((registration) => registration.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    return right({ registrations, projects })
  }
}
