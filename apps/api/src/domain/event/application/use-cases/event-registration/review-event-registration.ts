import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { EventRegistration } from '../../../enterprise/entities/event-registration'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { InvalidRegistrationStatusError } from '../../_errors/invalid-registration-status-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventRegistrationsRepository } from '../../repositories/event-registrations-repository'
import type { EventsRepository } from '../../repositories/events-repository'

type ReviewAction = 'APPROVE' | 'REJECT'

interface ReviewEventRegistrationUseCaseRequest {
  registrationId: string
  actorId: string
  action: ReviewAction
  reason?: string | null
}

type LogParams = {
  actorId: string
  sessionId: string | null
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type ReviewEventRegistrationUseCaseResponse = Either<
  EventNotFoundError | NotAllowedToManageEventError | InvalidRegistrationStatusError,
  { registration: EventRegistration }
>

export class ReviewEventRegistrationUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventRegistrationsRepository: EventRegistrationsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.UPDATE,
      resource: 'event.registration',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    registrationId,
    actorId,
    action,
    reason = null,
  }: ReviewEventRegistrationUseCaseRequest): Promise<ReviewEventRegistrationUseCaseResponse> {
    const registration = await this.eventRegistrationsRepository.findById(registrationId)

    if (!registration) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registrationId,
        status: AuditLogStatus.FAILURE,
        text: `Inscrição de projeto ${registrationId} não encontrada`,
      })

      return left(new InvalidRegistrationStatusError('Inscrição não encontrada'))
    }

    const event = await this.eventsRepository.findById(registration.eventId.toString())

    if (!event) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registrationId,
        status: AuditLogStatus.FAILURE,
        text: `Evento ${registration.eventId} não encontrada.`,
      })

      return left(new EventNotFoundError())
    }

    const canManage = await canManageInstitution(
      this.institutionMembersRepository,
      event.institutionId.toString(),
      actorId,
    )

    if (!canManage) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registrationId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${actorId} sem permissão para revisar inscrição.`,
      })

      return left(new NotAllowedToManageEventError())
    }

    if (action === 'REJECT' && !reason?.trim()) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registrationId,
        status: AuditLogStatus.FAILURE,
        text: 'Motivo obrigatório para rejeitar inscrição',
      })

      return left(new InvalidRegistrationStatusError('Motivo obrigatório para rejeitar inscrição'))
    }

    if (!registration.isPending()) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registrationId,
        status: AuditLogStatus.FAILURE,
        text: `Inscrição ${registrationId} já foi revisada.`,
      })

      return left(new InvalidRegistrationStatusError('Inscrição já foi revisada'))
    }

    const oldStatus = registration.status
    const reviewerId = new UniqueEntityId(actorId)

    if (action === 'APPROVE') {
      registration.approve(reviewerId, reason)
    }

    if (action === 'REJECT') {
      registration.reject(reviewerId, reason ?? '')
    }

    await this.eventRegistrationsRepository.save(registration)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: registration.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Inscrição ${registration.id.toString()} revisada: ${registration.status}.`,
      diff: {
        status: { old: oldStatus, new: registration.status },
        reviewReason: { old: null, new: registration.reviewReason },
      },
    })

    return right({ registration })
  }
}
