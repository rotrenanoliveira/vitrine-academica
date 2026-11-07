import { makeEvent } from '@tests/factories/make-event'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeVote } from '@tests/factories/make-vote'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryVotesRepository } from '@tests/repositories/in-memory-votes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import { GetVoteCounterUseCase } from './get-vote-counter'

let eventsRepository: InMemoryEventsRepository
let votesRepository: InMemoryVotesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: GetVoteCounterUseCase

describe('(UC) - Get Vote Counter', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    votesRepository = new InMemoryVotesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new GetVoteCounterUseCase(eventsRepository, votesRepository, membersRepository)
  })

  it('should be able to get counter', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()

    const { event } = makeEvent({ institutionId })
    event.closeThemeVoting()
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const themeA = new UniqueEntityId()
    const themeB = new UniqueEntityId()

    votesRepository.items.push(
      makeVote({ eventId: event.id, themeId: themeA, userId: new UniqueEntityId() }).vote,
      makeVote({ eventId: event.id, themeId: themeA, userId: new UniqueEntityId() }).vote,
      makeVote({ eventId: event.id, themeId: themeB, userId: new UniqueEntityId() }).vote,
    )

    const result = await sut.execute({
      eventId: event.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.counter).toEqual(
        expect.arrayContaining([
          { themeId: themeA.toString(), votes: 2 },
          { themeId: themeB.toString(), votes: 1 },
        ]),
      )
    }
  })

  it('should be able to get counter during theme selection', async () => {
    const institutionId = new UniqueEntityId()
    const actorId = new UniqueEntityId().toString()

    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: actorId,
        role: InstitutionMemberRole.MANAGER,
      }).member,
    )

    const themeId = new UniqueEntityId()
    votesRepository.items.push(makeVote({ eventId: event.id, themeId, userId: new UniqueEntityId() }).vote)

    const result = await sut.execute({
      eventId: event.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.counter).toEqual([{ themeId: themeId.toString(), votes: 1 }])
    }
  })

  it('should not be able to get counter without permission', async () => {
    const institutionId = new UniqueEntityId()

    const { event } = makeEvent({ institutionId })
    eventsRepository.items.push(event)

    const forbidden = await sut.execute({
      eventId: event.id.toString(),
      actorId: new UniqueEntityId().toString(),
    })

    expect(forbidden.value).toBeInstanceOf(NotAllowedToManageEventError)
  })
})
