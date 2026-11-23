import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { Event } from '../../../enterprise/entities/event'
import { EventRegistration } from '../../../enterprise/entities/event-registration'
import { DuplicateRegistrationError } from '../../_errors/duplicate-registration-error'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { NotEventProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotPublishedError } from '../../_errors/project-not-published-error'
import { canParticipateInEvent } from '../../authorization/can-participate-in-event'
import type { EventRegistrationsRepository } from '../../repositories/event-registrations-repository'
import type { EventsRepository } from '../../repositories/events-repository'

interface RegisterProjectInEventUseCaseRequest {
  eventId: string
  projectId: string
  userId: string
  now?: Date
}

type RegisterProjectInEventUseCaseResponse = Either<
  | EventNotFoundError
  | NotEligibleForEventError
  | EventWindowClosedError
  | ProjectNotFoundError
  | NotEventProjectOwnerError
  | ProjectNotPublishedError
  | DuplicateRegistrationError,
  { registration: EventRegistration }
>

export class RegisterProjectInEventUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventRegistrationsRepository: EventRegistrationsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    eventId,
    projectId,
    userId,
    now = new Date(),
  }: RegisterProjectInEventUseCaseRequest): Promise<RegisterProjectInEventUseCaseResponse> {
    const eventResult = await this.findEventOrFail(eventId, userId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const event = eventResult.value

    const eligible = await this.isEligibleForRegistration(event, userId)

    if (eligible.isLeft()) {
      return left(eligible.value)
    }

    const windowOpen = await this.validateRegistrationWindowOpen(event, now, userId)

    if (windowOpen.isLeft()) {
      return left(windowOpen.value)
    }

    const projectResult = await this.findProjectOrFail(projectId, userId, eventId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const owner = await this.isProjectOwner(project, userId, eventId, projectId)

    if (owner.isLeft()) {
      return left(owner.value)
    }

    const published = await this.isProjectPublished(project, userId, projectId, eventId)

    if (published.isLeft()) {
      return left(published.value)
    }

    const alreadyRegistered = await this.isProjectAlreadyRegistered(eventId, projectId, userId)

    if (alreadyRegistered.isLeft()) {
      return left(alreadyRegistered.value)
    }

    const registration = await this.createEventRegistration(event, projectId, userId)

    return right({
      registration,
    })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'event.registration',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findEventOrFail(eventId: string, userId: string): Promise<Either<EventNotFoundError, Event>> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Evento ${eventId} não encontrado.`,
      })

      return left(new EventNotFoundError())
    }

    return right(event)
  }

  private async isEligibleForRegistration(
    event: Event,
    userId: string,
  ): Promise<Either<NotEligibleForEventError, true>> {
    const isEligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

    if (!isEligible) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} não elegível para participar do evento.`,
      })

      return left(new NotEligibleForEventError())
    }

    return right(true)
  }

  private async validateRegistrationWindowOpen(
    event: Event,
    now: Date,
    userId: string,
  ): Promise<Either<EventWindowClosedError, null>> {
    if (!event.isAcceptingRegistrations(now)) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Inscrições fechadas para o evento ${event.id.toString()}.`,
      })

      return left(new EventWindowClosedError())
    }

    return right(null)
  }

  private async findProjectOrFail(
    projectId: string,
    userId: string,
    eventId: string,
  ): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Projeto ${projectId} não encontrado.`,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async isProjectOwner(
    project: Project,
    userId: string,
    eventId: string,
    projectId: string,
  ): Promise<Either<NotEventProjectOwnerError, true>> {
    if (project.author.toString() !== userId) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} não tem permissão para inscrever o projeto ${projectId} no evento ${eventId}.`,
      })

      return left(new NotEventProjectOwnerError())
    }

    return right(true)
  }

  private async isProjectPublished(
    project: Project,
    userId: string,
    projectId: string,
    eventId: string,
  ): Promise<Either<ProjectNotPublishedError, true>> {
    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Projeto ${projectId} não está publicado.`,
      })

      return left(new ProjectNotPublishedError())
    }

    return right(true)
  }

  private async isProjectAlreadyRegistered(
    eventId: string,
    projectId: string,
    userId: string,
  ): Promise<Either<DuplicateRegistrationError, true>> {
    const existing = await this.eventRegistrationsRepository.findByEventAndProject(eventId, projectId)

    if (existing) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Projeto ${projectId} já está inscrito no evento ${eventId}.`,
      })

      return left(new DuplicateRegistrationError())
    }

    return right(true)
  }

  private async createEventRegistration(event: Event, projectId: string, userId: string) {
    const registration = EventRegistration.create({
      eventId: event.id,
      projectId: new UniqueEntityId(projectId),
      responsibleUserId: new UniqueEntityId(userId),
    })

    await this.eventRegistrationsRepository.create(registration)

    await this.log({
      actorId: userId,
      sessionId: null,
      resourceId: registration.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Projeto ${projectId} inscrito no evento ${event.id.toString()}.`,
      diff: {
        projectId: { old: null, new: projectId },
        status: { old: null, new: registration.status },
      },
    })

    return registration
  }
}
