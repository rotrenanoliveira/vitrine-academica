import { FetchPublicEventsUseCase } from '@/domain/event/application/use-cases/event/fetch-public-events'
import { FetchPublicEventsController } from '../../controllers/event/fetch-public-events.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchPublicEventsController() {
  const deps = makeEventDeps()
  const fetchPublicEventsUseCase = new FetchPublicEventsUseCase(deps.eventsRepository)

  return new FetchPublicEventsController(fetchPublicEventsUseCase)
}
