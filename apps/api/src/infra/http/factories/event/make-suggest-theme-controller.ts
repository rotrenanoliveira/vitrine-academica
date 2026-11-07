import { SuggestThemeUseCase } from '@/domain/event/application/use-cases/theme/suggest-theme'
import { SuggestThemeController } from '../../controllers/event/suggest-theme.controller'
import { makeEventDeps } from './make-event-deps'

export function makeSuggestThemeController() {
  const deps = makeEventDeps()
  return new SuggestThemeController(
    new SuggestThemeUseCase(
      deps.eventsRepository,
      deps.themesRepository,
      deps.institutionMembersRepository,
      deps.registerLog,
    ),
  )
}
