import { makeEvent } from '@tests/factories/make-event'
import { makeInstitution } from '@tests/factories/make-institution'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventPhase, ParticipationScope } from '../../../enterprise/entities/event'
import { FetchInstitutionEventsUseCase } from './fetch-institution-events'

let eventsRepository: InMemoryEventsRepository
let institutionsRepository: InMemoryInstitutionsRepository
let sut: FetchInstitutionEventsUseCase

describe('(UC) - Fetch Institution Events', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    institutionsRepository = new InMemoryInstitutionsRepository()
    sut = new FetchInstitutionEventsUseCase(eventsRepository, institutionsRepository)
  })

  it('should be able to list all events of an institution', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { event: themeSelection } = makeEvent({ institutionId: institution.id })
    const { event: open } = makeEvent({ institutionId: institution.id, startsAt: new Date('2026-02-01T12:00:00.000Z') })
    open.closeThemeVoting()
    open.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.themeTitlesById.set('theme-1', 'Tema institucional')

    const { event: other } = makeEvent({
      institutionId: new UniqueEntityId(),
      startsAt: new Date('2026-03-01T12:00:00.000Z'),
    })

    eventsRepository.items.push(themeSelection, open, other)

    const result = await sut.execute({ institutionId: institution.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.events).toHaveLength(2)
      expect(result.value.events.map((item) => item.event.phase)).toEqual(
        expect.arrayContaining([EventPhase.THEME_SELECTION, EventPhase.OPEN]),
      )
      expect(result.value.events.find((item) => item.event.id.toString() === open.id.toString())?.winner).toBe(
        'Tema institucional',
      )
      expect(
        result.value.events.find((item) => item.event.id.toString() === themeSelection.id.toString())?.winner,
      ).toBeNull()
    }
  })

  it('should filter institution events by participation scope', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { event: globalCycle } = makeEvent({
      institutionId: institution.id,
      participationScope: ParticipationScope.GLOBAL,
    })
    const { event: institutionCycle } = makeEvent({
      institutionId: institution.id,
      participationScope: ParticipationScope.INSTITUTION,
      startsAt: new Date('2026-02-01T12:00:00.000Z'),
    })

    eventsRepository.items.push(globalCycle, institutionCycle)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      participationScope: ParticipationScope.INSTITUTION,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.events).toHaveLength(1)
      expect(result.value.events[0].event.id.toString()).toBe(institutionCycle.id.toString())
    }
  })

  it('should not be able to list events of a invalid institution', async () => {
    const result = await sut.execute({ institutionId: 'invalid-institution-id' })

    expect(result.isLeft()).toBeTruthy()
  })
})
