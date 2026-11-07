import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Theme } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

type ModerationAction = 'APPROVE' | 'REJECT' | 'HIDE'

interface ModerateThemeUseCaseRequest {
  themeId: string
  actorId: string
  action: ModerationAction
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

type ModerateThemeUseCaseResponse = Either<
  EventNotFoundError | InvalidThemeError | NotAllowedToManageEventError,
  { theme: Theme }
>

export class ModerateThemeUseCase {
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
      resource: 'event.theme',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    themeId,
    actorId,
    action,
    reason = null,
  }: ModerateThemeUseCaseRequest): Promise<ModerateThemeUseCaseResponse> {
    const theme = await this.themesRepository.findById(themeId)

    if (!theme) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: themeId,
        status: AuditLogStatus.FAILURE,
        text: `Tema ${themeId} não encontrado.`,
      })
      return left(new InvalidThemeError('Tema não encontrado'))
    }

    const event = await this.eventsRepository.findById(theme.eventId.toString())

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
        resourceId: themeId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${actorId} sem permissão para moderar tema.`,
      })
      return left(new NotAllowedToManageEventError())
    }

    if (action === 'REJECT' && !reason?.trim()) {
      return left(new InvalidThemeError('Motivo obrigatório para rejeitar tema'))
    }

    const oldStatus = theme.status
    const moderatorId = new UniqueEntityId(actorId)

    if (action === 'APPROVE') {
      theme.approve(moderatorId, reason)
    }

    if (action === 'REJECT') {
      theme.reject(moderatorId, reason ?? '')
    }

    if (action === 'HIDE') {
      theme.hide(moderatorId, reason)
    }

    await this.themesRepository.save(theme)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: theme.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Tema ${theme.id.toString()} moderado: ${theme.status}.`,
      diff: {
        status: { old: oldStatus, new: theme.status },
        moderationReason: { old: null, new: theme.moderationReason },
      },
    })

    return right({ theme })
  }
}
