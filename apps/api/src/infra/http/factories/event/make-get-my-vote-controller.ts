import { GetMyVoteUseCase } from '@/domain/event/application/use-cases/vote/get-my-vote'
import { GetMyVoteController } from '../../controllers/event/get-my-vote.controller'
import { makeEventDeps } from './make-event-deps'

export function makeGetMyVoteController() {
  const deps = makeEventDeps()
  const getMyVotesUseCase = new GetMyVoteUseCase(
    deps.eventsRepository,
    deps.votesRepository,
    deps.institutionMembersRepository,
  )

  return new GetMyVoteController(getMyVotesUseCase)
}
