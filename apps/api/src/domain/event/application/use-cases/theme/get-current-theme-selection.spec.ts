import { makeEvent } from '@tests/factories/make-event'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeTheme } from '@tests/factories/make-theme'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { ParticipationScope } from '../../../enterprise/entities/event'
import { EventNotFoundError } from '../../_errors/event-not-found-error'
import { NotEligibleForEventError } from '../../_errors/not-eligible-for-event-error'
import { GetCurrentThemeSelectionUseCase } from './get-current-theme-selection'

let eventsRepository: InMemoryEventsRepository
let themesRepository: InMemoryThemesRepository
let membersRepository: InMemoryInstitutionMembersRepository
let sut: GetCurrentThemeSelectionUseCase

describe('(UC) - Get Current Theme Selection', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    themesRepository = new InMemoryThemesRepository()
    membersRepository = new InMemoryInstitutionMembersRepository()
    sut = new GetCurrentThemeSelectionUseCase(eventsRepository, themesRepository, membersRepository)
  })

  it('should be able to get event and themes', async () => {
    const { event } = makeEvent({ participationScope: ParticipationScope.GLOBAL })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: event.id.toString(),
      userId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.id.toString()).toBe(event.id.toString())
      expect(result.value.themes).toHaveLength(1)
    }
  })

  it('should be able to get theme selection by event slug', async () => {
    const { event } = makeEvent({
      participationScope: ParticipationScope.GLOBAL,
      slug: 'ciclo-slug-teste',
    })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({ eventId: event.id })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: 'ciclo-slug-teste',
      userId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.id.toString()).toBe(event.id.toString())
      expect(result.value.themes).toHaveLength(1)
    }
  })

  it('should not be able to get theme selection when ineligible', async () => {
    const institutionId = new UniqueEntityId()

    const { event: privateEvent } = makeEvent({
      institutionId,
      participationScope: ParticipationScope.INSTITUTION,
    })
    eventsRepository.items.push(privateEvent)

    const ineligible = await sut.execute({
      eventId: privateEvent.id.toString(),
      userId: new UniqueEntityId().toString(),
    })

    const { event: publicEvent } = makeEvent({
      institutionId,
      participationScope: ParticipationScope.GLOBAL,
    })

    publicEvent.closeThemeVoting()
    publicEvent.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(publicEvent)

    const listed = await sut.execute({
      eventId: publicEvent.id.toString(),
      userId: new UniqueEntityId().toString(),
    })

    const managerId = new UniqueEntityId().toString()
    membersRepository.items.push(
      makeInstitutionMember({
        institutionId: institutionId.toString(),
        userId: managerId,
        role: InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
      }).member,
    )

    const asManager = await sut.execute({
      eventId: publicEvent.id.toString(),
      userId: managerId,
    })

    expect(ineligible.value).toBeInstanceOf(NotEligibleForEventError)
    expect(listed.value).toBeInstanceOf(EventNotFoundError)
    expect(asManager.isRight()).toBeTruthy()
  })
})
