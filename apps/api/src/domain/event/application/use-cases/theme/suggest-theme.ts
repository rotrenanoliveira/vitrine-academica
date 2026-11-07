import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { Theme } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { canParticipateInEvent } from '../../authorization/can-participate-in-event'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

interface SuggestThemeUseCaseRequest {
  eventId: string
  authorId: string
  title: string
  description: string
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

type SuggestThemeUseCaseResponse = Either<
  EventNotFoundError | NotEligibleForEventError | EventWindowClosedError,
  { theme: Theme }
>

export class SuggestThemeUseCase {
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
      action: AuditLogAction.CREATE,
      resource: 'event.theme',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    eventId,
    authorId,
    title,
    description,
    now = new Date(),
  }: SuggestThemeUseCaseRequest): Promise<SuggestThemeUseCaseResponse> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      await this.log({
        actorId: authorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Evento ${eventId} não encontrado para sugestão de tema.`,
      })
      return left(new EventNotFoundError())
    }

    const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, authorId)

    if (!eligible) {
      await this.log({
        actorId: authorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${authorId} não elegível para sugerir tema.`,
      })
      return left(new NotEligibleForEventError())
    }

    if (!event.isAcceptingThemeSuggestions(now)) {
      await this.log({
        actorId: authorId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Janela de sugestão fechada no evento ${eventId}.`,
      })
      return left(new EventWindowClosedError())
    }

    const theme = Theme.create({
      eventId: event.id,
      authorId: new UniqueEntityId(authorId),
      title,
      description,
    })

    await this.themesRepository.create(theme)

    await this.log({
      actorId: authorId,
      sessionId: null,
      resourceId: theme.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Tema ${theme.id.toString()} sugerido no evento ${eventId}.`,
      diff: {
        title: { old: null, new: title },
        description: { old: null, new: description },
      },
    })

    return right({ theme })
  }
}
