import { CreateEventUseCase } from '@/domain/event/application/use-cases/event/create-event'
import { CreateEventController } from '../../controllers/event/create-event.controller'
import { makeEventDeps } from './make-event-deps'

export function makeCreateEventController() {
  const deps = makeEventDeps()
  const useCase = new CreateEventUseCase(
    deps.eventsRepository,
    deps.institutionsRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new CreateEventController(useCase)
}
