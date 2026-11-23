import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
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

  async execute({
    registrationId,
    actorId,
    action,
    reason = null,
  }: ReviewEventRegistrationUseCaseRequest): Promise<ReviewEventRegistrationUseCaseResponse> {
    const registrationResult = await this.findRegistrationOrFail(registrationId, actorId)

    if (registrationResult.isLeft()) {
      return left(registrationResult.value)
    }

    const registration = registrationResult.value

    const eventResult = await this.findEventForRegistration(registration, actorId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const canManage = await this.canManageEvent(eventResult.value, actorId, registrationId)

    if (canManage.isLeft()) {
      return left(canManage.value)
    }

    const reasonResult = await this.validateRejectReason(action, reason, actorId, registrationId)

    if (reasonResult.isLeft()) {
      return left(reasonResult.value)
    }

    const pending = await this.validateRegistrationPending(registration, actorId)

    if (pending.isLeft()) {
      return left(pending.value)
    }

    const { oldStatus } = this.moderateRegistration(registration, action, actorId, reason)

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

    return right({
      registration,
    })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'event.registration',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findRegistrationOrFail(
    registrationId: string,
    actorId: string,
  ): Promise<Either<InvalidRegistrationStatusError, EventRegistration>> {
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

    return right(registration)
  }

  private async findEventForRegistration(
    registration: EventRegistration,
    actorId: string,
  ): Promise<Either<EventNotFoundError, Event>> {
    const event = await this.eventsRepository.findById(registration.eventId.toString())

    if (!event) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registration.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Evento ${registration.eventId} não encontrada.`,
      })

      return left(new EventNotFoundError())
    }

    return right(event)
  }

  private async canManageEvent(
    event: Event,
    actorId: string,
    registrationId: string,
  ): Promise<Either<NotAllowedToManageEventError, true>> {
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

    return right(true)
  }

  private async validateRejectReason(
    action: ReviewAction,
    reason: string | null,
    actorId: string,
    registrationId: string,
  ): Promise<Either<InvalidRegistrationStatusError, null>> {
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

    return right(null)
  }

  private async validateRegistrationPending(
    registration: EventRegistration,
    actorId: string,
  ): Promise<Either<InvalidRegistrationStatusError, null>> {
    if (!registration.isPending()) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: registration.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Inscrição ${registration.id.toString()} já foi revisada.`,
      })

      return left(new InvalidRegistrationStatusError('Inscrição já foi revisada'))
    }

    return right(null)
  }

  private moderateRegistration(
    registration: EventRegistration,
    action: ReviewAction,
    actorId: string,
    reason: string | null,
  ) {
    const oldStatus = registration.status
    const reviewerId = new UniqueEntityId(actorId)

    if (action === 'APPROVE') {
      registration.approve(reviewerId, reason)
    }

    if (action === 'REJECT') {
      registration.reject(reviewerId, reason ?? '')
    }

    return { oldStatus }
  }
}
