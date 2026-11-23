import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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
    const subscriptionResult = await this.findSubscriptionByTokenOrFail(token)

    if (subscriptionResult.isLeft()) {
      return left(subscriptionResult.value)
    }

    const subscription = subscriptionResult.value

    if (subscription.status === SubscriptionStatus.UNSUBSCRIBED) {
      return right({ subscription })
    }

    await this.unsubscribe(subscription)

    return right({ subscription })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'author.subscription',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findSubscriptionByTokenOrFail(
    token: string,
  ): Promise<Either<SubscriptionNotFoundError, AuthorSubscription>> {
    const subscription = await this.subscriptionsRepository.findByToken(token)

    if (!subscription) {
      return left(new SubscriptionNotFoundError())
    }

    return right(subscription)
  }

  private async unsubscribe(subscription: AuthorSubscription) {
    subscription.unsubscribe()
    await this.subscriptionsRepository.save(subscription)

    await this.log({
      actorId: subscription.subscriberId.toString(),
      resourceId: subscription.id.toString(),
      text: `Assinatura ${subscription.id.toString()} cancelada pelo link do e-mail.`,
      status: AuditLogStatus.SUCCESS,
    })
  }
}
