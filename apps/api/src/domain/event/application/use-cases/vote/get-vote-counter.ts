import { type Either, left, right } from '@/core/either'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemeVoteCounter, VotesRepository } from '../../repositories/votes-repository'

interface GetVoteCounterUseCaseRequest {
  eventId: string
  actorId: string
}

type GetVoteCounterUseCaseResponse = Either<
  EventNotFoundError | NotAllowedToManageEventError,
  { counter: ThemeVoteCounter[] }
>

export class GetVoteCounterUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly votesRepository: VotesRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({ eventId, actorId }: GetVoteCounterUseCaseRequest): Promise<GetVoteCounterUseCaseResponse> {
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
      return left(new NotAllowedToManageEventError())
    }

    const counter = await this.votesRepository.countByThemeForEvent(eventId)

    return right({ counter })
  }
}
