import { type Either, right } from '@/core/either'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import type { AuditLogsRepository } from '../../repositories/audit-logs-repository'

interface FetchLogsByActorIdUseCaseRequest {
  actorId: string
}

type FetchLogsByActorIdUseCaseResponse = Either<unknown, { logs: AuditLog[] }>

export class FetchLogsByActorIdUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async execute({ actorId }: FetchLogsByActorIdUseCaseRequest): Promise<FetchLogsByActorIdUseCaseResponse> {
    const logs = await this.auditLogsRepository.findManyByActorId(actorId)

    return right({
      logs,
    })
  }
}
