import { FetchApprovedThemesUseCase } from '@/domain/event/application/use-cases/theme/fetch-approved-themes'
import { FetchApprovedThemesController } from '../../controllers/event/fetch-approved-themes.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchApprovedThemesController() {
  const deps = makeEventDeps()
  const fetchApprovedThemesUseCase = new FetchApprovedThemesUseCase(deps.eventsRepository, deps.themesRepository)

  return new FetchApprovedThemesController(fetchApprovedThemesUseCase)
}
