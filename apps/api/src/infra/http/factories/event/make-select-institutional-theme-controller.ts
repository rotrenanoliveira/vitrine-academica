import { SelectInstitutionalThemeUseCase } from '@/domain/event/application/use-cases/event/select-institutional-theme'
import { SelectInstitutionalThemeController } from '../../controllers/event/select-institutional-theme.controller'
import { makeEventDeps } from './make-event-deps'

export function makeSelectInstitutionalThemeController() {
  const deps = makeEventDeps()
  const selectInstitutionalThemeUseCase = new SelectInstitutionalThemeUseCase(
    deps.eventsRepository,
    deps.themesRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new SelectInstitutionalThemeController(selectInstitutionalThemeUseCase)
}
