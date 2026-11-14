import { type Either, right } from '@/core/either'
import type { EventPhase, ParticipationScope } from '../../../enterprise/entities/event'
import type { EventListItem, EventsRepository } from '../../repositories/events-repository'

interface FetchPublicEventsUseCaseRequest {
  page?: number
  perPage?: number
  institutionIds?: string[]
  phases?: EventPhase[]
  participationScope?: ParticipationScope
}

type FetchPublicEventsUseCaseResponse = Either<
  never,
  {
    events: EventListItem[]
    total: number
    page: number
    perPage: number
  }
>

export class FetchPublicEventsUseCase {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async execute({
    page = 1,
    perPage = 30,
    institutionIds,
    phases,
    participationScope,
  }: FetchPublicEventsUseCaseRequest = {}): Promise<FetchPublicEventsUseCaseResponse> {
    const result = await this.eventsRepository.findManyPublic({
      page,
      perPage,
      institutionIds,
      phases,
      participationScope,
    })

    return right({
      events: result.items,
      total: result.total,
      page,
      perPage,
    })
  }
}
