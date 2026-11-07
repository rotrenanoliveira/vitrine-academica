import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
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

type LogParams = {
  actorId: string
  sessionId: string | null
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'event.registration',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    eventId,
    projectId,
    userId,
    now = new Date(),
  }: RegisterProjectInEventUseCaseRequest): Promise<RegisterProjectInEventUseCaseResponse> {
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

    const isEligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

    if (!isEligible) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} não elegível para participar do evento.`,
      })

      return left(new NotEligibleForEventError())
    }

    if (!event.isAcceptingRegistrations(now)) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Inscrições fechadas para o evento ${eventId}.`,
      })

      return left(new EventWindowClosedError())
    }

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
      text: `Projeto ${projectId} inscrito no evento ${eventId}.`,
      diff: {
        projectId: { old: null, new: projectId },
        status: { old: null, new: registration.status },
      },
    })

    return right({ registration })
  }
}
