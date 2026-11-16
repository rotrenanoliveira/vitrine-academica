import { makeEvent } from '@tests/factories/make-event'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeTheme } from '@tests/factories/make-theme'
import { InMemoryEventsRepository } from '@tests/repositories/in-memory-events-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryThemesRepository } from '@tests/repositories/in-memory-themes-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { ParticipationScope } from '../../../enterprise/entities/event'
import { ThemeStatus } from '../../../enterprise/entities/theme'
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

  it('should be able to get event and approved themes', async () => {
    const { event } = makeEvent({ participationScope: ParticipationScope.GLOBAL })
    eventsRepository.items.push(event)

    const { theme } = makeTheme({ eventId: event.id, status: ThemeStatus.APPROVED })
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

    const { theme } = makeTheme({ eventId: event.id, status: ThemeStatus.APPROVED })
    themesRepository.items.push(theme)

    const result = await sut.execute({
      eventId: 'ciclo-slug-teste',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.event.id.toString()).toBe(event.id.toString())
      expect(result.value.themes).toHaveLength(1)
    }
  })

  it('should return only approved themes to visitors and the full list to managers', async () => {
    const institutionId = new UniqueEntityId()
    const { event } = makeEvent({
      institutionId,
      participationScope: ParticipationScope.INSTITUTION,
    })
    eventsRepository.items.push(event)

    const { theme: pending } = makeTheme({ eventId: event.id, title: 'Pendente' })
    const { theme: approved } = makeTheme({
      eventId: event.id,
      title: 'Aprovado',
      status: ThemeStatus.APPROVED,
    })
    themesRepository.items.push(pending, approved)

    const visitor = await sut.execute({ eventId: event.id.toString() })
    const ineligible = await sut.execute({
      eventId: event.id.toString(),
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
      eventId: event.id.toString(),
      userId: managerId,
    })

    expect(visitor.isRight()).toBeTruthy()
    expect(ineligible.isRight()).toBeTruthy()
    if (visitor.isRight() && ineligible.isRight()) {
      expect(visitor.value.themes.map((theme) => theme.title)).toEqual(['Aprovado'])
      expect(ineligible.value.themes.map((theme) => theme.title)).toEqual(['Aprovado'])
    }

    expect(asManager.isRight()).toBeTruthy()
    if (asManager.isRight()) {
      expect(asManager.value.themes).toHaveLength(2)
    }
  })

  it('should return approved themes after the event is publicly listed', async () => {
    const { event } = makeEvent({ participationScope: ParticipationScope.GLOBAL })
    event.closeThemeVoting()
    event.selectWinnerTheme(new UniqueEntityId('theme-1'))
    eventsRepository.items.push(event)

    const { theme: approved } = makeTheme({ eventId: event.id, status: ThemeStatus.APPROVED })
    const { theme: pending } = makeTheme({ eventId: event.id })
    themesRepository.items.push(approved, pending)

    const result = await sut.execute({ eventId: event.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.themes).toHaveLength(1)
      expect(result.value.themes[0]?.status).toBe(ThemeStatus.APPROVED)
    }
  })
})
