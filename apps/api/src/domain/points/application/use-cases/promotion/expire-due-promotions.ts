import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { type Promotion, PromotionStatus } from '../../../enterprise/entities/promotion'
import type { PromotionsRepository } from '../../repositories/promotions-repository'

const SYSTEM_ACTOR_ID = 'internal-system'

interface ExpireDuePromotionsUseCaseRequest {
  now?: Date
}

type SystemLogParams = Omit<LogParams, 'actorId'>

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
      const expired = await this.expirePromotion(promotion, now)

      if (expired) {
        expiredPromotions.push(expired)
      }
    }

    return right({ expiredPromotions })
  }

  private async log({ resourceId, sessionId, text, status, diff }: SystemLogParams) {
    await this.registerLog.execute({
      actorId: SYSTEM_ACTOR_ID,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'points.promotion',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async expirePromotion(promotion: Promotion, now: Date): Promise<Promotion | null> {
    const expired = await this.promotionsRepository.tryExpire(promotion.id.toString(), now)

    if (!expired) {
      return null
    }

    promotion.expire()

    await this.logExpired(promotion)

    return promotion
  }

  private async logExpired(promotion: Promotion) {
    await this.log({
      resourceId: promotion.id.toString(),
      diff: {
        status: { old: PromotionStatus.ACTIVE, new: promotion.status },
      },
      status: AuditLogStatus.SUCCESS,
      text: `Promoção ${promotion.id.toString()} do projeto ${promotion.projectId.toString()} encerrada automaticamente ao fim da validade.`,
    })
  }
}
