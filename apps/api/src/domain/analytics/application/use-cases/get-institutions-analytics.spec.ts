import { InMemoryAnalyticsRepository } from '@tests/repositories/in-memory-analytics-repository'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { GetInstitutionsAnalyticsUseCase } from './get-institutions-analytics'

let analyticsRepository: InMemoryAnalyticsRepository
let sut: GetInstitutionsAnalyticsUseCase

describe('(UC) - Get Institutions Analytics', () => {
  beforeEach(() => {
    analyticsRepository = new InMemoryAnalyticsRepository()
    sut = new GetInstitutionsAnalyticsUseCase(analyticsRepository)
  })

  it('deve somar as instituições e preencher com zero os status ausentes', async () => {
    analyticsRepository.institutionsByStatus = [
      { label: 'ACTIVE', total: 3 },
      { label: 'SUSPENDED', total: 1 },
    ]

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.total).toBe(4)
      expect(result.value.byStatus).toHaveLength(4)
      expect(result.value.byStatus).toEqual(
        expect.arrayContaining([
          { label: 'ACTIVE', total: 3 },
          { label: 'SUSPENDED', total: 1 },
          { label: 'INACTIVE', total: 0 },
          { label: 'ARCHIVED', total: 0 },
        ]),
      )
    }
  })

  it('deve preencher com zero os papéis sem membros ativos', async () => {
    analyticsRepository.activeMembersByRole = [
      { label: 'STUDENT', total: 5 },
      { label: 'MANAGER', total: 2 },
    ]

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.membersByRole).toHaveLength(Object.values(InstitutionMemberRole).length)
      expect(result.value.membersByRole).toEqual(
        expect.arrayContaining([
          { label: 'STUDENT', total: 5 },
          { label: 'MANAGER', total: 2 },
        ]),
      )
    }
  })

  it('deve devolver as solicitações de vínculo pendentes', async () => {
    analyticsRepository.pendingMembershipRequests = 7

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.pendingMembershipRequests).toBe(7)
    }
  })
})
