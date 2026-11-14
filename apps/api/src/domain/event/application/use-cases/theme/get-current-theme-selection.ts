import { type Either, left, right } from '@/core/either'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
import type { Theme } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { canParticipateInEvent } from '../../authorization/can-participate-in-event'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

interface GetCurrentThemeSelectionUseCaseRequest {
  eventId: string
  userId: string
}

type GetCurrentThemeSelectionUseCaseResponse = Either<
  EventNotFoundError | NotEligibleForEventError,
  { event: Event; themes: Theme[] }
>

export class GetCurrentThemeSelectionUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly themesRepository: ThemesRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    eventId,
    userId,
  }: GetCurrentThemeSelectionUseCaseRequest): Promise<GetCurrentThemeSelectionUseCaseResponse> {
    const event = (await this.eventsRepository.findById(eventId)) ?? (await this.eventsRepository.findBySlug(eventId))

    if (!event) {
      return left(new EventNotFoundError())
    }

    const canManage = await canManageInstitution(
      this.institutionMembersRepository,
      event.institutionId.toString(),
      userId,
    )

    if (!canManage) {
      const eligible = await canParticipateInEvent(this.institutionMembersRepository, event, userId)

      if (!eligible) {
        return left(new NotEligibleForEventError())
      }

      if (event.isPubliclyListed()) {
        return left(new EventNotFoundError())
      }
    }

    const themes = await this.themesRepository.findManyByEventId(event.id.toString())

    return right({ event, themes })
  }
}
