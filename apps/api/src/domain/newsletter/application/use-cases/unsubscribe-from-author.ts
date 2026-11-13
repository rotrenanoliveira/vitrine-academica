import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { type AuthorSubscription, SubscriptionStatus } from '../../enterprise/entities/author-subscription'
import { NotSubscriptionOwnerError } from '../_errors/not-subscription-owner-error'
import { SubscriptionNotFoundError } from '../_errors/subscription-not-found-error'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'

interface UnsubscribeFromAuthorUseCaseRequest {
  subscriptionId: string
  requesterId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
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

  private async log({ actorId, resourceId, text, status }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'author.subscription',
      resourceId,
      diff: null,
      status,
      text,
    })
  }

  async execute({
    subscriptionId,
    requesterId,
  }: UnsubscribeFromAuthorUseCaseRequest): Promise<UnsubscribeFromAuthorUseCaseResponse> {
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

    if (subscription.subscriberId.toString() !== requesterId) {
      await this.log({
        actorId: requesterId,
        resourceId: subscriptionId,
        text: `Usuário ${requesterId} tentou cancelar a assinatura ${subscriptionId}, que não é dele.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotSubscriptionOwnerError())
    }

    if (subscription.status === SubscriptionStatus.UNSUBSCRIBED) {
      return right({ subscription })
    }

    subscription.unsubscribe()
    await this.subscriptionsRepository.save(subscription)

    await this.log({
      actorId: requesterId,
      resourceId: subscriptionId,
      text: `Assinatura ${subscriptionId} cancelada.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ subscription })
  }
}
