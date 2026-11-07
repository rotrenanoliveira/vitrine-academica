import { type Either, left, right } from '@/core/either'
import { type Theme, ThemeStatus } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

interface FetchApprovedThemesUseCaseRequest {
  eventId: string
}

type FetchApprovedThemesUseCaseResponse = Either<EventNotFoundError, { themes: Theme[] }>

export class FetchApprovedThemesUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly themesRepository: ThemesRepository,
  ) {}

  async execute({ eventId }: FetchApprovedThemesUseCaseRequest): Promise<FetchApprovedThemesUseCaseResponse> {
    const event = await this.eventsRepository.findById(eventId)

    if (!event) {
      return left(new EventNotFoundError())
    }

    const themes = await this.themesRepository.findManyByEventId(eventId, ThemeStatus.APPROVED)

    return right({ themes })
  }
}
