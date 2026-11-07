import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
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

type LogParams = {
  actorId: string
  sessionId: string | null
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'event.vote',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    eventId,
    themeId,
    userId,
    now = new Date(),
  }: VoteThemeUseCaseRequest): Promise<VoteThemeUseCaseResponse> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      return left(new EventNotFoundError())
    }

    const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

    if (!eligible) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Usuário ${userId} não elegível para votar.`,
      })
      return left(new NotEligibleForEventError())
    }

    if (!event.isAcceptingVotes(now)) {
      await this.log({
        actorId: userId,
        sessionId: null,
        resourceId: eventId,
        status: AuditLogStatus.FAILURE,
        text: `Janela de votação fechada no evento ${eventId}.`,
      })
      return left(new EventWindowClosedError())
    }

    const theme = await this.themesRepository.findById(themeId)

    if (!theme || theme.eventId.toString() !== eventId || !theme.isApproved()) {
      return left(new InvalidThemeError())
    }

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
      text: `Voto registrado no tema ${themeId} do evento ${eventId}.`,
      diff: {
        themeId: { old: null, new: themeId },
      },
    })

    return right({ vote })
  }
}
