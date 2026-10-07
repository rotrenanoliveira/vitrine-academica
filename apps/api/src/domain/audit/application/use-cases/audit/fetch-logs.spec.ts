import { makeAuditLog } from '@tests/factories/make-audit-log'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { FetchLogsUseCase } from './fetch-logs'

let auditLogsRepository: InMemoryAuditLogsRepository
let sut: FetchLogsUseCase

describe('(UC) - Fetch Logs', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository()
    sut = new FetchLogsUseCase(auditLogsRepository)
  })

  it('should be able to fetch all audit logs', async () => {
    const { auditLog: firstLog } = makeAuditLog({ resource: 'project' })
    const { auditLog: secondLog } = makeAuditLog({ resource: 'user' })
    auditLogsRepository.items.push(firstLog, secondLog)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(2)
      expect(result.value.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ resource: 'project' }),
          expect.objectContaining({ resource: 'user' }),
        ]),
      )
    }
  })

  it('should be able to fetch an empty list when there are no audit logs', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(0)
    }
  })
})
