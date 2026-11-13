import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { type AuthorSubscription, SubscriptionStatus } from '../../enterprise/entities/author-subscription'
import { SubscriptionNotFoundError } from '../_errors/subscription-not-found-error'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'

interface UnsubscribeByTokenUseCaseRequest {
  token: string
}

type UnsubscribeByTokenUseCaseResponse = Either<SubscriptionNotFoundError, { subscription: AuthorSubscription }>

export class UnsubscribeByTokenUseCase {
  constructor(
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ token }: UnsubscribeByTokenUseCaseRequest): Promise<UnsubscribeByTokenUseCaseResponse> {
    const subscription = await this.subscriptionsRepository.findByToken(token)

    if (!subscription) {
      return left(new SubscriptionNotFoundError())
    }

    if (subscription.status === SubscriptionStatus.UNSUBSCRIBED) {
      return right({ subscription })
    }

    subscription.unsubscribe()
    await this.subscriptionsRepository.save(subscription)

    await this.registerLog.execute({
      actorId: subscription.subscriberId.toString(),
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'author.subscription',
      resourceId: subscription.id.toString(),
      diff: null,
      status: AuditLogStatus.SUCCESS,
      text: `Assinatura ${subscription.id.toString()} cancelada pelo link do e-mail.`,
    })

    return right({ subscription })
  }
}
