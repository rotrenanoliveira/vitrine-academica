import { FetchEventRegistrationsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-event-registrations'
import { FetchEventRegistrationsController } from '../../controllers/event/fetch-event-registrations.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchEventRegistrationsController() {
  const deps = makeEventDeps()
  const fetchEventRegistrationsUseCase = new FetchEventRegistrationsUseCase(
    deps.eventsRepository,
    deps.eventRegistrationsRepository,
    deps.projectsRepository,
    deps.institutionMembersRepository,
  )

  return new FetchEventRegistrationsController(fetchEventRegistrationsUseCase)
}
