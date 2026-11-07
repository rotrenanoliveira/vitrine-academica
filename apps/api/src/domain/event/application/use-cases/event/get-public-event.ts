import { type Either, left, right } from '@/core/either'
import type { Event } from '../../../enterprise/entities/event'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import type { EventsRepository } from '../../repositories/events-repository'

interface GetPublicEventUseCaseRequest {
  eventId?: string
  eventSlug?: string
}

type GetPublicEventUseCaseResponse = Either<EventNotFoundError, { event: Event }>

export class GetPublicEventUseCase {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async execute({ eventId, eventSlug }: GetPublicEventUseCaseRequest): Promise<GetPublicEventUseCaseResponse> {
    const event = eventId
      ? await this.eventsRepository.findById(eventId)
      : eventSlug
        ? await this.eventsRepository.findBySlug(eventSlug)
        : null

    if (!event?.isPubliclyListed()) {
      return left(new EventNotFoundError())
    }

    return right({ event })
  }
}
