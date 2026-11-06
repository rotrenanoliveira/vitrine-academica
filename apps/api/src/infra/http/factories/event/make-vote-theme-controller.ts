import { VoteThemeUseCase } from '@/domain/event/application/use-cases/vote/vote-theme'
import { VoteThemeController } from '../../controllers/event/vote-theme.controller'
import { makeEventDeps } from './make-event-deps'

export function makeVoteThemeController() {
  const deps = makeEventDeps()
  const voteThemeUseCase = new VoteThemeUseCase(
    deps.eventsRepository,
    deps.themesRepository,
    deps.votesRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new VoteThemeController(voteThemeUseCase)
}
