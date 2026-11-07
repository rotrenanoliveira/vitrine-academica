import { ModerateThemeUseCase } from '@/domain/event/application/use-cases/theme/moderate-theme'
import { ModerateThemeController } from '../../controllers/event/moderate-theme.controller'
import { makeEventDeps } from './make-event-deps'

export function makeModerateThemeController() {
  const deps = makeEventDeps()
  const moderateThemeUseCase = new ModerateThemeUseCase(
    deps.eventsRepository,
    deps.themesRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new ModerateThemeController(moderateThemeUseCase)
}
