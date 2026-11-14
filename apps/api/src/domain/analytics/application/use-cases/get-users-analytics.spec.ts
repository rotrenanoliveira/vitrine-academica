import { InMemoryAnalyticsRepository } from '@tests/repositories/in-memory-analytics-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { GetUsersAnalyticsUseCase } from './get-users-analytics'

let analyticsRepository: InMemoryAnalyticsRepository
let sut: GetUsersAnalyticsUseCase

describe('(UC) - Get Users Analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T12:00:00.000Z'))
    analyticsRepository = new InMemoryAnalyticsRepository()
    sut = new GetUsersAnalyticsUseCase(analyticsRepository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve somar o total e preencher com zero os status sem usuários', async () => {
    analyticsRepository.usersByStatus = [
      { label: 'ACTIVE', total: 3 },
      { label: 'PENDING', total: 1 },
    ]

    const result = await sut.execute({ days: 7 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.total).toBe(4)
      expect(result.value.byStatus).toHaveLength(Object.values(UserStatus).length)
      expect(result.value.byStatus).toEqual(
        expect.arrayContaining([
          { label: 'ACTIVE', total: 3 },
          { label: 'PENDING', total: 1 },
          { label: 'BLOCKED', total: 0 },
        ]),
      )
    }
  })

  it('deve montar a série diária do período e ignorar dias anteriores', async () => {
    analyticsRepository.usersCreatedByDay = [
      { date: '2026-11-02', total: 9 },
      { date: '2026-11-04', total: 1 },
      { date: '2026-11-06', total: 3 },
    ]

    const result = await sut.execute({ days: 3 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.createdInPeriod).toBe(4)
      expect(result.value.createdByDay).toEqual([
        { date: '2026-11-04', total: 1 },
        { date: '2026-11-05', total: 0 },
        { date: '2026-11-06', total: 3 },
      ])
    }
  })

  it('deve devolver tudo zerado quando não há usuários', async () => {
    const result = await sut.execute({ days: 5 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.total).toBe(0)
      expect(result.value.createdInPeriod).toBe(0)
      expect(result.value.createdByDay).toHaveLength(5)
    }
  })
})
