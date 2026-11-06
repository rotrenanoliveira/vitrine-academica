import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Event } from '../../../enterprise/entities/event'
import type { EventsRepository } from '../../repositories/events-repository'

interface AdvanceDueEventPhasesUseCaseRequest {
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

type AdvanceDueEventPhasesUseCaseResponse = Either<unknown, { closedThemeSelection: Event[]; closedEvents: Event[] }>

export class AdvanceDueEventPhasesUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
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

  async execute({
    now = new Date(),
  }: AdvanceDueEventPhasesUseCaseRequest = {}): Promise<AdvanceDueEventPhasesUseCaseResponse> {
    const closedThemeSelection: Event[] = []
    const closedEvents: Event[] = []

    const dueThemeSelection = await this.eventsRepository.findDueForThemeSelectionClose(now)

    for (const event of dueThemeSelection) {
      const advanced = await this.eventsRepository.tryAdvanceFromThemeSelection(event.id.toString(), now)

      if (!advanced) {
        continue
      }

      const updated = await this.eventsRepository.findById(event.id.toString())
      if (!updated) continue

      closedThemeSelection.push(updated)

      await this.log({
        actorId: 'internal-system',
        sessionId: null,
        resourceId: updated.id.toString(),
        status: AuditLogStatus.SUCCESS,
        text: `Votação encerrada; evento movido para INSTITUTIONAL_SELECTION.`,
        diff: {
          phase: { old: 'THEME_SELECTION', new: updated.phase },
        },
      })
    }

    const dueClosing = await this.eventsRepository.findDueForClosing(now)

    for (const event of dueClosing) {
      const advanced = await this.eventsRepository.tryAdvanceFromOpenToClosed(event.id.toString(), now)

      if (!advanced) {
        continue
      }

      const updated = await this.eventsRepository.findById(event.id.toString())
      if (!updated) continue

      closedEvents.push(updated)

      await this.log({
        actorId: 'internal-system',
        sessionId: null,
        resourceId: updated.id.toString(),
        status: AuditLogStatus.SUCCESS,
        text: `Evento encerrado automaticamente em endsAt.`,
        diff: {
          phase: { old: 'OPEN', new: updated.phase },
        },
      })
    }

    return right({ closedThemeSelection, closedEvents })
  }
}
