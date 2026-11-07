import { makeEvent } from '@tests/factories/make-event'
import { makeVote } from '@tests/factories/make-vote'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryVotesRepository } from '@tests/repositories/in-memory-votes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ParticipationScope } from '../../../enterprise/entities/event'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { GetMyVoteUseCase } from './get-my-vote'

let eventsRepository: InMemoryEventsRepository
let votesRepository: InMemoryVotesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: GetMyVoteUseCase

describe('(UC) - Get My Vote', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    votesRepository = new InMemoryVotesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new GetMyVoteUseCase(eventsRepository, votesRepository, membersRepository)
  })

  it('should be able to get the user vote or null when eligible', async () => {
    const { event } = makeEvent({ participationScope: ParticipationScope.GLOBAL })
    eventsRepository.items.push(event)

    const userId = new UniqueEntityId()
    const { vote } = makeVote({ eventId: event.id, userId, themeId: new UniqueEntityId() })
    votesRepository.items.push(vote)

    const withVote = await sut.execute({ eventId: event.id.toString(), userId: userId.toString() })
    const withoutVote = await sut.execute({ eventId: event.id.toString(), userId: new UniqueEntityId().toString() })

    expect(withVote.isRight()).toBeTruthy()

    if (withVote.isRight()) {
      expect(withVote.value.vote?.id.toString()).toBe(vote.id.toString())
    }

    expect(withoutVote.isRight()).toBeTruthy()

    if (withoutVote.isRight()) {
      expect(withoutVote.value.vote).toBeNull()
    }
  })

  it('should not be able to get vote when event is missing or user is ineligible', async () => {
    const { event } = makeEvent({ participationScope: ParticipationScope.INSTITUTION })
    eventsRepository.items.push(event)

    const missing = await sut.execute({
      eventId: new UniqueEntityId().toString(),
      userId: new UniqueEntityId().toString(),
    })
    const ineligible = await sut.execute({
      eventId: event.id.toString(),
      userId: new UniqueEntityId().toString(),
    })

    expect(missing.value).toBeInstanceOf(EventNotFoundError)
    expect(ineligible.value).toBeInstanceOf(NotEligibleForEventError)
  })
})
