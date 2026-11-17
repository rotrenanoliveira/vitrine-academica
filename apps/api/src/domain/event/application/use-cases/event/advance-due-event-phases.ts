import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Event } from '../../../enterprise/entities/event'
import type { EventsRepository } from '../../repositories/events-repository'

interface AdvanceDueEventPhasesUseCaseRequest {
  now?: Date
}

type AdvanceDueEventPhasesUseCaseResponse = Either<unknown, { closedThemeSelection: Event[]; closedEvents: Event[] }>

export class AdvanceDueEventPhasesUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    now = new Date(),
  }: AdvanceDueEventPhasesUseCaseRequest = {}): Promise<AdvanceDueEventPhasesUseCaseResponse> {
    const closedThemeSelection = await this.closeThemeSelection(now)
    const closedEvents = await this.closeEvents(now)

    return right({
      closedThemeSelection,
      closedEvents,
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

  private async closeThemeSelection(now: Date) {
    const closedThemeSelection: Event[] = []
    const dueThemeSelection = await this.eventsRepository.findDueForThemeSelectionClose(now)

    for (const event of dueThemeSelection) {
      const advanced = await this.eventsRepository.tryAdvanceFromThemeSelection(event.id.toString(), now)

      if (!advanced) {
        continue
      }

      const updated = await this.eventsRepository.findById(event.id.toString())
      if (!updated) continue

      closedThemeSelection.push(updated)

      await this.logEventPhaseChange(
        updated,
        `Votação encerrada; evento movido para INSTITUTIONAL_SELECTION.`,
        'THEME_SELECTION',
      )
    }

    return closedThemeSelection
  }

  private async closeEvents(now: Date) {
    const closedEvents: Event[] = []
    const dueClosing = await this.eventsRepository.findDueForClosing(now)

    for (const event of dueClosing) {
      const advanced = await this.eventsRepository.tryAdvanceFromOpenToClosed(event.id.toString(), now)

      if (!advanced) {
        continue
      }

      const updated = await this.eventsRepository.findById(event.id.toString())
      if (!updated) continue

      closedEvents.push(updated)

      await this.logEventPhaseChange(updated, `Evento encerrado automaticamente em endsAt.`, 'OPEN')
    }

    return closedEvents
  }

  private async logEventPhaseChange(event: Event, text: string, oldPhaseLabel: string) {
    await this.log({
      actorId: 'internal-system',
      sessionId: null,
      resourceId: event.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text,
      diff: {
        phase: { old: oldPhaseLabel, new: event.phase },
      },
    })
  }
}
