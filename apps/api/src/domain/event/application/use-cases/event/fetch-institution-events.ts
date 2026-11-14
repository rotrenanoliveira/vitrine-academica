import { type Either, left, right } from '@/core/either'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import type { EventPhase, ParticipationScope } from '../../../enterprise/entities/event'
import type { EventListItem, EventsRepository } from '../../repositories/events-repository'

interface FetchInstitutionEventsUseCaseRequest {
  institutionId: string
  page?: number
  perPage?: number
  phase?: EventPhase
  participationScope?: ParticipationScope
}

type FetchInstitutionEventsUseCaseResponse = Either<InstitutionNotFoundError, { events: EventListItem[] }>

export class FetchInstitutionEventsUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly institutionsRepository: InstitutionsRepository,
  ) {}

  async execute({
    institutionId,
    page = 1,
    perPage = 20,
    phase,
    participationScope,
  }: FetchInstitutionEventsUseCaseRequest): Promise<FetchInstitutionEventsUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const events = await this.eventsRepository.findManyByInstitutionId({
      institutionId,
      page,
      perPage,
      phase,
      participationScope,
    })

    return right({ events })
  }
}
