import { makeEvent } from '@tests/factories/make-event'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventPhase, ParticipationScope } from '../../../enterprise/entities/event'
import { FetchPublicEventsUseCase } from './fetch-public-events'

let eventsRepository: InMemoryEventsRepository
let sut: FetchPublicEventsUseCase

describe('(UC) - Fetch Public Events', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryEventsRepository()
    sut = new FetchPublicEventsUseCase(eventsRepository)
  })

  it('should be able to list events', async () => {
    const institutionId = new UniqueEntityId()
    eventsRepository.institutionNamesById.set(institutionId.toString(), 'UMC')

    const { event: themeSelection } = makeEvent({ institutionId })
    const { event: open } = makeEvent({ institutionId, startsAt: new Date('2026-02-01T12:00:00.000Z') })
    open.closeThemeVoting()
    open.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.themeTitlesById.set('theme-1', 'Tema vencedor')

    const otherInstitutionId = new UniqueEntityId()
    eventsRepository.institutionNamesById.set(otherInstitutionId.toString(), 'Outra')

    const { event: otherInstitution } = makeEvent({
      institutionId: otherInstitutionId,
      startsAt: new Date('2026-03-01T12:00:00.000Z'),
    })
    otherInstitution.closeThemeVoting()
    otherInstitution.selectWinnerTheme(new UniqueEntityId('theme-2'))

    eventsRepository.items.push(themeSelection, open, otherInstitution)

    const all = await sut.execute()
    const filtered = await sut.execute({
      institutionIds: [institutionId.toString()],
      phases: [EventPhase.OPEN],
    })

    expect(all.isRight()).toBeTruthy()

    if (all.isRight()) {
      expect(all.value.events).toHaveLength(3)
      expect(all.value.total).toBe(3)
      expect(all.value.page).toBe(1)
      expect(all.value.perPage).toBe(30)
      expect(all.value.events.find((item) => item.event.id.toString() === open.id.toString())?.winner).toBe(
        'Tema vencedor',
      )
      expect(all.value.events.find((item) => item.event.id.toString() === open.id.toString())?.institutionName).toBe(
        'UMC',
      )
      expect(
        all.value.events.find((item) => item.event.id.toString() === themeSelection.id.toString())?.winner,
      ).toBeNull()
    }

    expect(filtered.isRight()).toBeTruthy()

    if (filtered.isRight()) {
      expect(filtered.value.events).toHaveLength(1)
      expect(filtered.value.total).toBe(1)
      expect(filtered.value.events[0].event.id.toString()).toBe(open.id.toString())
      expect(filtered.value.events[0].winner).toBe('Tema vencedor')
    }
  })

  it('should filter public events by participation scope', async () => {
    const { event: globalOpen } = makeEvent({
      participationScope: ParticipationScope.GLOBAL,
      startsAt: new Date('2026-02-01T12:00:00.000Z'),
    })
    globalOpen.closeThemeVoting()
    globalOpen.selectWinnerTheme(new UniqueEntityId('theme-global'))

    const { event: institutionOpen } = makeEvent({
      participationScope: ParticipationScope.INSTITUTION,
      startsAt: new Date('2026-03-01T12:00:00.000Z'),
    })
    institutionOpen.closeThemeVoting()
    institutionOpen.selectWinnerTheme(new UniqueEntityId('theme-institution'))

    eventsRepository.items.push(globalOpen, institutionOpen)

    const result = await sut.execute({ participationScope: ParticipationScope.GLOBAL })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.events).toHaveLength(1)
      expect(result.value.events[0].event.id.toString()).toBe(globalOpen.id.toString())
    }
  })

  it('should list institution-scoped early phases when phases are explicit', async () => {
    const { event: institutionThemeSelection } = makeEvent({
      participationScope: ParticipationScope.INSTITUTION,
    })

    eventsRepository.items.push(institutionThemeSelection)

    const withoutPhases = await sut.execute()
    const withPhases = await sut.execute({
      phases: [EventPhase.THEME_SELECTION, EventPhase.INSTITUTIONAL_SELECTION],
    })

    expect(withoutPhases.isRight()).toBeTruthy()
    if (withoutPhases.isRight()) {
      expect(withoutPhases.value.events).toHaveLength(0)
    }

    expect(withPhases.isRight()).toBeTruthy()
    if (withPhases.isRight()) {
      expect(withPhases.value.events).toHaveLength(1)
      expect(withPhases.value.events[0].event.id.toString()).toBe(institutionThemeSelection.id.toString())
    }
  })
})
