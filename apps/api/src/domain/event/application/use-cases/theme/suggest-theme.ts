import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
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

type CreateThemeSuggestionInput = {
  description: string
  authorId: string
  title: string
  event: Event
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

  async execute({ now = new Date(), ...params }: SuggestThemeUseCaseRequest): Promise<SuggestThemeUseCaseResponse> {
    const eventResult = await this.findEventOrFail(params.eventId, params.authorId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const event = eventResult.value

    const eligible = await this.isEligibleParticipant(event, params.authorId)

    if (eligible.isLeft()) {
      return left(eligible.value)
    }

    const windowOpen = await this.validateThemeSuggestionWindow(event, now, params.authorId)

    if (windowOpen.isLeft()) {
      return left(windowOpen.value)
    }

    const theme = await this.createThemeSuggestion({ event, ...params })

    return right({ theme })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'event.theme',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findEventOrFail(eventId: string, authorId: string): Promise<Either<EventNotFoundError, Event>> {
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

    return right(event)
  }

  private async isEligibleParticipant(event: Event, authorId: string): Promise<Either<NotEligibleForEventError, true>> {
    const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, authorId)

    if (!eligible) {
      await this.log({
        actorId: authorId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${authorId} não elegível para sugerir tema.`,
      })

      return left(new NotEligibleForEventError())
    }

    return right(true)
  }

  private async validateThemeSuggestionWindow(
    event: Event,
    now: Date,
    authorId: string,
  ): Promise<Either<EventWindowClosedError, null>> {
    if (!event.isAcceptingThemeSuggestions(now)) {
      await this.log({
        actorId: authorId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Janela de sugestão fechada no evento ${event.id.toString()}.`,
      })

      return left(new EventWindowClosedError())
    }

    return right(null)
  }

  private async createThemeSuggestion({ event, authorId, title, description }: CreateThemeSuggestionInput) {
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
      text: `Tema ${theme.id.toString()} sugerido no evento ${event.id.toString()}.`,
      diff: {
        title: { old: null, new: title },
        description: { old: null, new: description },
      },
    })

    return theme
  }
}
