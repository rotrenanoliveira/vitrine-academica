import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { type Event, EventPhase } from '../../../enterprise/entities/event'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { InvalidEventPhaseError } from '../../_errors/invalid-event-phase-error'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

interface SelectInstitutionalThemeUseCaseRequest {
  eventId: string
  themeId: string
  actorId: string
}

type LogParams = {
  actorId: string
  sessionId: string | null
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type SelectInstitutionalThemeUseCaseResponse = Either<
  EventNotFoundError | NotAllowedToManageEventError | InvalidEventPhaseError | InvalidThemeError,
  { event: Event }
>

export class SelectInstitutionalThemeUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly themesRepository: ThemesRepository,
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

  async execute({
    eventId,
    themeId,
    actorId,
  }: SelectInstitutionalThemeUseCaseRequest): Promise<SelectInstitutionalThemeUseCaseResponse> {
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
      await this.log({
        actorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${actorId} sem permissão para selecionar tema.`,
      })
      return left(new NotAllowedToManageEventError())
    }

    const canSelectEarly = event.phase === EventPhase.THEME_SELECTION
    const canSelectAfterVoting = event.phase === EventPhase.INSTITUTIONAL_SELECTION

    if (!canSelectEarly && !canSelectAfterVoting) {
      return left(new InvalidEventPhaseError())
    }

    const theme = await this.themesRepository.findById(themeId)

    if (!theme || theme.eventId.toString() !== eventId || !theme.isApproved()) {
      return left(new InvalidThemeError())
    }

    const previousPhase = event.phase

    try {
      event.selectWinnerTheme(theme.id)
    } catch {
      return left(new InvalidEventPhaseError())
    }

    await this.eventsRepository.save(event)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: event.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: canSelectEarly
        ? `Tema ${themeId} selecionado antecipadamente; votação encerrada e evento aberto.`
        : `Tema ${themeId} selecionado; evento aberto.`,
      diff: {
        phase: { old: previousPhase, new: event.phase },
        winnerThemeId: { old: null, new: themeId },
      },
    })

    return right({ event })
  }
}
