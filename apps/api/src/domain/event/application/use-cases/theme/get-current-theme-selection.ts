import { type Either, left, right } from '@/core/either'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { Event } from '../../../enterprise/entities/event'
import { type Theme, ThemeStatus } from '../../../enterprise/entities/theme'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import type { EventsRepository } from '../../repositories/events-repository'
import type { ThemesRepository } from '../../repositories/themes-repository'

interface GetCurrentThemeSelectionUseCaseRequest {
  eventId: string
  userId?: string
}

type GetCurrentThemeSelectionUseCaseResponse = Either<EventNotFoundError, { event: Event; themes: Theme[] }>

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

    const canManage = userId
      ? await canManageInstitution(this.institutionMembersRepository, event.institutionId.toString(), userId)
      : false

    const themes = canManage
      ? await this.themesRepository.findManyByEventId(event.id.toString())
      : await this.themesRepository.findManyByEventId(event.id.toString(), ThemeStatus.APPROVED)

    return right({ event, themes })
  }
}
