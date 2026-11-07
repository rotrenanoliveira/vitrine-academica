import { FetchApprovedParticipantsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-approved-participants'
import { FetchApprovedParticipantsController } from '../../controllers/event/fetch-approved-participants.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchApprovedParticipantsController() {
  const deps = makeEventDeps()
  const fetchApprovedParticipantsUseCase = new FetchApprovedParticipantsUseCase(
    deps.eventsRepository,
    deps.eventRegistrationsRepository,
    deps.projectsRepository,
  )

  return new FetchApprovedParticipantsController(fetchApprovedParticipantsUseCase)
}
