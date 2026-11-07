import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

type LogParams = {
  actorId: string
  sessionId: string | null
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type EditEventNameUseCaseResponse = Either<EventNotFoundError | NotAllowedToManageEventError, { event: Event }>

export class EditEventNameUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.UPDATE,
      resource: 'event',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({ eventId, actorId, name }: EditEventNameUseCaseRequest): Promise<EditEventNameUseCaseResponse> {
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

    const canManage = await canManageInstitution(
      this.institutionMembersRepository,
      event.institutionId.toString(),
      actorId,
    )

    if (!canManage) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${actorId} sem permissão para editar evento.`,
      })

      return left(new NotAllowedToManageEventError())
    }

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

    return right({ event })
  }
}
