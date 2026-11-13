import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { type Promotion, PromotionStatus } from '../../../enterprise/entities/promotion'
import type { PromotionsRepository } from '../../repositories/promotions-repository'

interface ExpireDuePromotionsUseCaseRequest {
  now?: Date
}

type ExpireDuePromotionsUseCaseResponse = Either<never, { expiredPromotions: Promotion[] }>

export class ExpireDuePromotionsUseCase {
  constructor(
    private readonly promotionsRepository: PromotionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    now = new Date(),
  }: ExpireDuePromotionsUseCaseRequest = {}): Promise<ExpireDuePromotionsUseCaseResponse> {
    const expiredPromotions: Promotion[] = []

    const duePromotions = await this.promotionsRepository.findManyDueForExpiration(now)

    for (const promotion of duePromotions) {
      const expired = await this.promotionsRepository.tryExpire(promotion.id.toString(), now)

      if (!expired) {
        continue
      }

      promotion.expire()
      expiredPromotions.push(promotion)

      await this.registerLog.execute({
        actorId: 'internal-system',
        sessionId: null,
        action: AuditLogAction.UPDATE,
        resource: 'points.promotion',
        resourceId: promotion.id.toString(),
        diff: {
          status: { old: PromotionStatus.ACTIVE, new: promotion.status },
        },
        status: AuditLogStatus.SUCCESS,
        text: `Promoção ${promotion.id.toString()} do projeto ${promotion.projectId.toString()} encerrada automaticamente ao fim da validade.`,
      })
    }

    return right({ expiredPromotions })
  }
}
