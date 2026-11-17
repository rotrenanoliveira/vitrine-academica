import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventsRepository } from '../../repositories/events-repository'

interface EditEventNameUseCaseRequest {
  eventId: string
  actorId: string
  name: string
}

type EditEventNameUseCaseResponse = Either<EventNotFoundError | NotAllowedToManageEventError, { event: Event }>

export class EditEventNameUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ eventId, actorId, name }: EditEventNameUseCaseRequest): Promise<EditEventNameUseCaseResponse> {
    const eventResult = await this.findEventOrFail(eventId, actorId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const event = eventResult.value

    const canManage = await this.canManageEvent(event, actorId)

    if (canManage.isLeft()) {
      return left(canManage.value)
    }

    const { event: updatedEvent } = await this.updateEvent(event, name, actorId)

    return right({
      event: updatedEvent,
    })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'event',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findEventOrFail(eventId: string, actorId: string): Promise<Either<EventNotFoundError, Event>> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Evento ${eventId} não encontrado.`,
      })

      return left(new EventNotFoundError())
    }

    return right(event)
  }

  private async canManageEvent(event: Event, actorId: string): Promise<Either<NotAllowedToManageEventError, true>> {
    const canManage = await canManageInstitution(
      this.institutionMembersRepository,
      event.institutionId.toString(),
      actorId,
    )

    if (!canManage) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${actorId} sem permissão para editar evento.`,
      })

      return left(new NotAllowedToManageEventError())
    }

    return right(true)
  }

  private async updateEvent(event: Event, name: string, actorId: string) {
    const oldName = event.name
    event.rename(name)

    await this.eventsRepository.save(event)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: event.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Nome do evento atualizado.`,
      diff: {
        name: { old: oldName, new: name },
      },
    })

    return { event }
  }
}
