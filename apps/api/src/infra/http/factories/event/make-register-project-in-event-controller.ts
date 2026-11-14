import { RegisterProjectInEventUseCase } from '@/domain/event/application/use-cases/event-registration/register-project-in-event'
import { RegisterProjectInEventController } from '../../controllers/event/register-project-in-event.controller'
import { makeEventDeps } from './make-event-deps'

export function makeRegisterProjectInEventController() {
  const deps = makeEventDeps()
  const registerProjectInEventUseCase = new RegisterProjectInEventUseCase(
    deps.eventsRepository,
    deps.eventRegistrationsRepository,
    deps.projectsRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new RegisterProjectInEventController(registerProjectInEventUseCase)
}
