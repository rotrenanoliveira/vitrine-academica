import { EditEventNameUseCase } from '@/domain/event/application/use-cases/event/edit-event-name'
import { EditEventNameController } from '../../controllers/event/edit-event-name.controller'
import { makeEventDeps } from './make-event-deps'

export function makeEditEventNameController() {
  const deps = makeEventDeps()
  return new EditEventNameController(
    new EditEventNameUseCase(deps.eventsRepository, deps.institutionMembersRepository, deps.registerLog),
  )
}
