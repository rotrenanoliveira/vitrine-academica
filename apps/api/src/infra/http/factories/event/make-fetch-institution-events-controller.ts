import { FetchInstitutionEventsUseCase } from '@/domain/event/application/use-cases/event/fetch-institution-events'
import { FetchInstitutionEventsController } from '../../controllers/event/fetch-institution-events.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchInstitutionEventsController() {
  const deps = makeEventDeps()
  const fetchInstitutionEventsUseCase = new FetchInstitutionEventsUseCase(
    deps.eventsRepository,
    deps.institutionsRepository,
  )

  return new FetchInstitutionEventsController(fetchInstitutionEventsUseCase)
}
