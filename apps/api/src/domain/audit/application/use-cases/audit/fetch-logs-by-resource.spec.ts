import { makeAuditLog } from '@tests/factories/make-audit-log'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { FetchLogsByResourceUseCase } from './fetch-logs-by-resource'

let auditLogsRepository: InMemoryAuditLogsRepository
let sut: FetchLogsByResourceUseCase

describe('(UC) - Fetch Logs By Resource', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository()
    sut = new FetchLogsByResourceUseCase(auditLogsRepository)
  })

  it('should be able to fetch audit logs by resource', async () => {
    const { auditLog: firstLog } = makeAuditLog({ resource: 'project' })
    const { auditLog: secondLog } = makeAuditLog({ resource: 'project' })
    const { auditLog: otherResourceLog } = makeAuditLog({ resource: 'user' })
    auditLogsRepository.items.push(firstLog, secondLog, otherResourceLog)

    const result = await sut.execute({
      resource: 'project',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(2)
      expect(result.value.logs.map((log) => log.id.toString())).toEqual(
        expect.arrayContaining([firstLog.id.toString(), secondLog.id.toString()]),
      )
    }
  })

  it('should be able to fetch an empty list when the resource has no logs', async () => {
    const result = await sut.execute({
      resource: 'institution',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(0)
    }
  })
})
