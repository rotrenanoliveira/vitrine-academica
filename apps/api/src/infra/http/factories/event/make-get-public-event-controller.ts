import { GetPublicEventUseCase } from '@/domain/event/application/use-cases/event/get-public-event'
import { GetPublicEventController } from '../../controllers/event/get-public-event.controller'
import { makeEventDeps } from './make-event-deps'

export function makeGetPublicEventController() {
  const deps = makeEventDeps()
  const getPublicEventUseCase = new GetPublicEventUseCase(deps.eventsRepository)

  return new GetPublicEventController(getPublicEventUseCase)
}
