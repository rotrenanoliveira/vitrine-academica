import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
import type { Theme } from '../../../enterprise/entities/theme'
import { Vote } from '../../../enterprise/entities/vote'
import { DuplicateVoteError } from '../../_errors/duplicate-vote-error'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { EventWindowClosedError } from '../../_errors/event-window-closed-error'
import { InvalidThemeError } from '../../_errors/invalid-theme-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { canParticipateInEvent } from '../../authorization/can-participate-in-event'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'
import type { VotesRepository } from '../../repositories/votes-repository'

interface VoteThemeUseCaseRequest {
  eventId: string
  themeId: string
  userId: string
  now?: Date
}

type VoteThemeUseCaseResponse = Either<
  EventNotFoundError | NotEligibleForEventError | EventWindowClosedError | InvalidThemeError | DuplicateVoteError,
  { vote: Vote }
>

export class VoteThemeUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly themesRepository: ThemesRepository,
    private readonly votesRepository: VotesRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ now = new Date(), ...params }: VoteThemeUseCaseRequest): Promise<VoteThemeUseCaseResponse> {
    const eventResult = await this.findEventOrFail(params.eventId, params.userId)

    if (eventResult.isLeft()) {
      return left(eventResult.value)
    }

    const event = eventResult.value

    const eligible = await this.isEligibleVote(event, params.userId)

    if (eligible.isLeft()) {
      return left(eligible.value)
    }

    const windowOpen = await this.validateVotingWindow(event, now, params.userId)

    if (windowOpen.isLeft()) {
      return left(windowOpen.value)
    }

    const themeResult = await this.getThemeToVote(params.themeId, params.eventId, params.userId)

    if (themeResult.isLeft()) {
      return left(themeResult.value)
    }

    const voteResult = await this.hasExistingVote(params.eventId, params.userId)

    if (voteResult.isLeft()) {
      return left(voteResult.value)
    }

    const vote = await this.createVote(event, themeResult.value, params.userId)

    return right({
      vote,
    })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'event.vote',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findEventOrFail(eventId: string, userId: string): Promise<Either<EventNotFoundError, Event>> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Evento ${eventId} não encontrado para votação.`,
      })

      return left(new EventNotFoundError())
    }

    return right(event)
  }

  private async isEligibleVote(event: Event, userId: string): Promise<Either<NotEligibleForEventError, true>> {
    const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

    if (!eligible) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} não elegível para votar.`,
      })

      return left(new NotEligibleForEventError())
    }

    return right(true)
  }

  private async validateVotingWindow(
    event: Event,
    now: Date,
    userId: string,
  ): Promise<Either<EventWindowClosedError, null>> {
    if (!event.isAcceptingVotes(now)) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: event.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: `Janela de votação fechada no evento ${event.id.toString()}.`,
      })

      return left(new EventWindowClosedError())
    }

    return right(null)
  }

  private async getThemeToVote(
    themeId: string,
    eventId: string,
    userId: string,
  ): Promise<Either<InvalidThemeError, Theme>> {
    const theme = await this.themesRepository.findById(themeId)

    if (!theme || theme.eventId.toString() !== eventId || !theme.isApproved()) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: themeId,
        status: AuditLogStatus.FAILURE,
        text: `Tema ${themeId} inválido para votação no evento ${eventId}.`,
      })

      return left(new InvalidThemeError())
    }

    return right(theme)
  }

  private async hasExistingVote(eventId: string, userId: string): Promise<Either<DuplicateVoteError, true>> {
    const existing = await this.votesRepository.findByEventAndUser(eventId, userId)

    if (existing) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} já votou no evento ${eventId}.`,
      })

      return left(new DuplicateVoteError())
    }

    return right(true)
  }

  private async createVote(event: Event, theme: Theme, userId: string) {
    const vote = Vote.create({
      eventId: event.id,
      themeId: theme.id,
      userId: new UniqueEntityId(userId),
    })

    await this.votesRepository.create(vote)

    await this.log({
      actorId: userId,
      sessionId: null,
      resourceId: vote.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Voto registrado no tema ${theme.id.toString()} do evento ${event.id.toString()}.`,
      diff: {
        themeId: { old: null, new: theme.id.toString() },
      },
    })

    return vote
  }
}
