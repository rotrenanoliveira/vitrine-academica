import { type Either, right } from '@/core/either'
import type { Event, EventPhase } from '../../../enterprise/entities/event'
import type { EventsRepository } from '../../repositories/events-repository'

interface FetchPublicEventsUseCaseRequest {
  page?: number
  perPage?: number
  institutionId?: string
  phase?: EventPhase
}

type FetchPublicEventsUseCaseResponse = Either<never, { events: Event[] }>

export class FetchPublicEventsUseCase {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    institutionId,
    phase,
  }: FetchPublicEventsUseCaseRequest = {}): Promise<FetchPublicEventsUseCaseResponse> {
    const events = await this.eventsRepository.findManyPublic({
      page,
      perPage,
      institutionId,
      phase,
    })

    return right({ events })
  }
}
