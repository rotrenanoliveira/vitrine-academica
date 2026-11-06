import { type Either, left, right } from '@/core/either'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Vote } from '../../../enterprise/entities/vote'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { canParticipateInEvent } from '../../authorization/can-participate-in-event'
import type { EventsRepository } from '../../repositories/events-repository'
import type { VotesRepository } from '../../repositories/votes-repository'

interface GetMyVoteUseCaseRequest {
  eventId: string
  userId: string
}

type GetMyVoteUseCaseResponse = Either<EventNotFoundError | NotEligibleForEventError, { vote: Vote | null }>

export class GetMyVoteUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly votesRepository: VotesRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({ eventId, userId }: GetMyVoteUseCaseRequest): Promise<GetMyVoteUseCaseResponse> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      return left(new EventNotFoundError())
    }

    const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

    if (!eligible) {
      return left(new NotEligibleForEventError())
    }

    const vote = await this.votesRepository.findByEventAndUser(eventId, userId)

    return right({ vote })
  }
}
