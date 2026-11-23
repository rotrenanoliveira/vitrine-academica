import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { type AuthorSubscription, SubscriptionStatus } from '../../enterprise/entities/author-subscription'
import { NotSubscriptionOwnerError } from '../_errors/not-subscription-owner-error'
import { SubscriptionNotFoundError } from '../_errors/subscription-not-found-error'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'

interface UnsubscribeFromAuthorUseCaseRequest {
  subscriptionId: string
  requesterId: string
}

type UnsubscribeFromAuthorUseCaseResponse = Either<
  SubscriptionNotFoundError | NotSubscriptionOwnerError,
  { subscription: AuthorSubscription }
>

export class UnsubscribeFromAuthorUseCase {
  constructor(
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    subscriptionId,
    requesterId,
  }: UnsubscribeFromAuthorUseCaseRequest): Promise<UnsubscribeFromAuthorUseCaseResponse> {
    const subscriptionResult = await this.findSubscriptionOrFail(subscriptionId, requesterId)

    if (subscriptionResult.isLeft()) {
      return left(subscriptionResult.value)
    }

    const subscription = subscriptionResult.value

    const ownerResult = await this.validateSubscriptionOwner(subscription, requesterId)

    if (ownerResult.isLeft()) {
      return left(ownerResult.value)
    }

    if (subscription.status === SubscriptionStatus.UNSUBSCRIBED) {
      return right({ subscription })
    }

    await this.unsubscribe(subscription, requesterId)

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

  private async findSubscriptionOrFail(
    subscriptionId: string,
    requesterId: string,
  ): Promise<Either<SubscriptionNotFoundError, AuthorSubscription>> {
    const subscription = await this.subscriptionsRepository.findById(subscriptionId)

    if (!subscription) {
      await this.log({
        actorId: requesterId,
        resourceId: subscriptionId,
        text: `Assinatura ${subscriptionId} não encontrada.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new SubscriptionNotFoundError())
    }

    return right(subscription)
  }

  private async validateSubscriptionOwner(
    subscription: AuthorSubscription,
    requesterId: string,
  ): Promise<Either<NotSubscriptionOwnerError, null>> {
    if (subscription.subscriberId.toString() !== requesterId) {
      const subscriptionId = subscription.id.toString()

      await this.log({
        actorId: requesterId,
        resourceId: subscriptionId,
        text: `Usuário ${requesterId} tentou cancelar a assinatura ${subscriptionId}, que não é dele.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotSubscriptionOwnerError())
    }

    return right(null)
  }

  private async unsubscribe(subscription: AuthorSubscription, requesterId: string) {
    const subscriptionId = subscription.id.toString()

    subscription.unsubscribe()
    await this.subscriptionsRepository.save(subscription)

    await this.log({
      actorId: requesterId,
      resourceId: subscriptionId,
      text: `Assinatura ${subscriptionId} cancelada.`,
      status: AuditLogStatus.SUCCESS,
    })
  }
}
