import { type Either, right } from '@/core/either'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import type { AuditLogsRepository } from '../../repositories/audit-logs-repository'

interface FetchLogsBySessionIdUseCaseRequest {
  sessionId: string
}

type FetchLogsBySessionIdUseCaseResponse = Either<unknown, { logs: AuditLog[] }>

export class FetchLogsBySessionIdUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async execute({ sessionId }: FetchLogsBySessionIdUseCaseRequest): Promise<FetchLogsBySessionIdUseCaseResponse> {
    const logs = await this.auditLogsRepository.findManyBySessionId(sessionId)

    return right({
      logs,
    })
  }
}
