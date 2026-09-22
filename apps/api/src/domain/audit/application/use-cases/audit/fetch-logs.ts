import { type Either, right } from '@/core/either'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import type { AuditLogsRepository } from '../../repositories/audit-logs-repository'

type FetchLogsUseCaseResponse = Either<unknown, { logs: AuditLog[] }>

export class FetchLogsUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async execute(): Promise<FetchLogsUseCaseResponse> {
    const logs = await this.auditLogsRepository.findAll()

    return right({
      logs,
    })
  }
}
