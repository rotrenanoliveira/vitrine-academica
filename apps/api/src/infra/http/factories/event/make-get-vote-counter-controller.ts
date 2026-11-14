import { GetVoteCounterUseCase } from '@/domain/event/application/use-cases/vote/get-vote-counter'
import { GetVoteCounterController } from '../../controllers/event/get-vote-counter.controller'
import { makeEventDeps } from './make-event-deps'

export function makeGetVoteCounterController() {
  const deps = makeEventDeps()
  const getVoteCounterUseCase = new GetVoteCounterUseCase(
    deps.eventsRepository,
    deps.votesRepository,
    deps.institutionMembersRepository,
  )

  return new GetVoteCounterController(getVoteCounterUseCase)
}
