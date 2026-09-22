import { type Either, right } from '@/core/either'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import type { AuditLogsRepository } from '../../repositories/audit-logs-repository'

interface FetchLogsByResourceUseCaseRequest {
  resource: string
}

type FetchLogsByResourceUseCaseResponse = Either<unknown, { logs: AuditLog[] }>

export class FetchLogsByResourceUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async execute({ resource }: FetchLogsByResourceUseCaseRequest): Promise<FetchLogsByResourceUseCaseResponse> {
    const logs = await this.auditLogsRepository.findManyByResource(resource)

    return right({
      logs,
    })
  }
}
