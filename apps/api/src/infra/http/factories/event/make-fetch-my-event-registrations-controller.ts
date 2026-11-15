import { FetchMyEventRegistrationsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-my-event-registrations'
import { FetchMyEventRegistrationsController } from '../../controllers/event/fetch-my-event-registrations.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchMyEventRegistrationsController() {
  const deps = makeEventDeps()
  const fetchMyEventRegistrationsUseCase = new FetchMyEventRegistrationsUseCase(
    deps.eventRegistrationsRepository,
    deps.eventsRepository,
    deps.projectsRepository,
  )

  return new FetchMyEventRegistrationsController(fetchMyEventRegistrationsUseCase)
}
