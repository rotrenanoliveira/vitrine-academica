import { GetCurrentThemeSelectionUseCase } from '@/domain/event/application/use-cases/theme/get-current-theme-selection'
import { GetCurrentThemeSelectionController } from '../../controllers/event/get-current-theme-selection.controller'
import { makeEventDeps } from './make-event-deps'

export function makeGetCurrentThemeSelectionController() {
  const deps = makeEventDeps()
  return new GetCurrentThemeSelectionController(
    new GetCurrentThemeSelectionUseCase(
      deps.eventsRepository,
      deps.themesRepository,
      deps.institutionMembersRepository,
    ),
  )
}
