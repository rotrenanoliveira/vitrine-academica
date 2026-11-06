import { InMemoryAnalyticsRepository } from '@tests/repositories/in-memory-analytics-repository'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { GetProjectsAnalyticsUseCase } from './get-projects-analytics'

let analyticsRepository: InMemoryAnalyticsRepository
let sut: GetProjectsAnalyticsUseCase

describe('(UC) - Get Projects Analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T12:00:00.000Z'))
    analyticsRepository = new InMemoryAnalyticsRepository()
    sut = new GetProjectsAnalyticsUseCase(analyticsRepository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve somar o total e preencher com zero os status sem projetos', async () => {
    analyticsRepository.projectsByStatus = [
      { label: 'PUBLISHED', total: 4 },
      { label: 'SKETCH', total: 2 },
    ]

    const result = await sut.execute({ days: 7 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.total).toBe(6)
      expect(result.value.byStatus).toHaveLength(Object.values(ProjectStatus).length)
      expect(result.value.byStatus).toEqual(
        expect.arrayContaining([
          { label: 'PUBLISHED', total: 4 },
          { label: 'SKETCH', total: 2 },
          { label: 'ARCHIVED', total: 0 },
        ]),
      )
    }
  })

  it('deve montar a série diária do período e ignorar dias anteriores', async () => {
    analyticsRepository.projectsCreatedByDay = [
      { date: '2026-11-03', total: 5 },
      { date: '2026-11-05', total: 2 },
    ]

    const result = await sut.execute({ days: 3 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.createdInPeriod).toBe(2)
      expect(result.value.createdByDay).toEqual([
        { date: '2026-11-04', total: 0 },
        { date: '2026-11-05', total: 2 },
        { date: '2026-11-06', total: 0 },
      ])
    }
  })

  it('deve devolver tudo zerado quando não há projetos', async () => {
    const result = await sut.execute({ days: 5 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.total).toBe(0)
      expect(result.value.createdInPeriod).toBe(0)
      expect(result.value.createdByDay).toHaveLength(5)
    }
  })
})
