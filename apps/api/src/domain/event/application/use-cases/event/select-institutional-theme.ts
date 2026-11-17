import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { type Event, EventPhase } from '../../../enterprise/entities/event'
import type { Theme } from '../../../enterprise/entities/theme'
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

  async execute({
    eventId,
    themeId,
    actorId,
  }: SelectInstitutionalThemeUseCaseRequest): Promise<SelectInstitutionalThemeUseCaseResponse> {
    const eventResult = await this.findEventOrFail(eventId, actorId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const event = eventResult.value

    const canManage = await this.canManageEvent(event, actorId)

    if (canManage.isLeft()) {
      return left(canManage.value)
    }

    const phaseResult = await this.validateThemeSelectionPhase(event, actorId)

    if (phaseResult.isLeft()) {
      return left(phaseResult.value)
    }

    const themeResult = await this.findApprovedThemeForEvent(themeId, eventId, actorId)

    if (themeResult.isLeft()) {
      return left(themeResult.value)
    }

    const theme = themeResult.value

    const applied = await this.selectWinnerTheme(event, theme, actorId)

    if (applied.isLeft()) {
      return left(applied.value)
    }

    await this.eventsRepository.save(event)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: event.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: phaseResult.value.canSelectEarly
        ? `Tema ${themeId} selecionado antecipadamente; votação encerrada e evento aberto.`
        : `Tema ${themeId} selecionado; evento aberto.`,
      diff: {
        phase: { old: applied.value.previousPhase, new: event.phase },
        winnerThemeId: { old: null, new: themeId },
      },
    })

    return right({ event })
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
        text: `Usuário ${actorId} sem permissão para selecionar tema.`,
      })

      return left(new NotAllowedToManageEventError())
    }

    return right(true)
  }

  private async validateThemeSelectionPhase(
    event: Event,
    actorId: string,
  ): Promise<Either<InvalidEventPhaseError, { canSelectEarly: boolean }>> {
    const canSelectEarly = event.phase === EventPhase.THEME_SELECTION
    const canSelectAfterVoting = event.phase === EventPhase.INSTITUTIONAL_SELECTION

    if (!canSelectEarly && !canSelectAfterVoting) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Fase inválida para seleção de tema: ${event.phase}.`,
      })

      return left(new InvalidEventPhaseError())
    }

    return right({ canSelectEarly })
  }

  private async findApprovedThemeForEvent(
    themeId: string,
    eventId: string,
    actorId: string,
  ): Promise<Either<InvalidThemeError, Theme>> {
    const theme = await this.themesRepository.findById(themeId)

    if (!theme || theme.eventId.toString() !== eventId || !theme.isApproved()) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: themeId,
        status: AuditLogStatus.FAILURE,
        text: `Tema ${themeId} inválido para o evento ${eventId}.`,
      })

      return left(new InvalidThemeError())
    }

    return right(theme)
  }

  private async selectWinnerTheme(
    event: Event,
    theme: Theme,
    actorId: string,
  ): Promise<Either<InvalidEventPhaseError, { previousPhase: EventPhase }>> {
    const previousPhase = event.phase

    try {
      event.selectWinnerTheme(theme.id)
    } catch {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Falha ao selecionar tema ${theme.id.toString()} na fase ${previousPhase}.`,
      })

      return left(new InvalidEventPhaseError())
    }

    return right({ previousPhase })
  }
}
