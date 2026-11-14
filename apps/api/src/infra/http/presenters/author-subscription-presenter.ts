import type { SubscriptionItem } from '@/domain/newsletter/application/use-cases/list-my-subscriptions'
import type { AuthorSubscription } from '@/domain/newsletter/enterprise/entities/author-subscription'

export class AuthorSubscriptionPresenter {
  static toHTTP(subscription: AuthorSubscription) {
    return {
      id: subscription.id.toString(),
      authorId: subscription.authorId.toString(),
      status: subscription.status,
      subscribedAt: subscription.subscribedAt.toISOString(),
      unsubscribedAt: subscription.unsubscribedAt?.toISOString() ?? null,
    }
  }

  static itemToHTTP({ subscription, author }: SubscriptionItem) {
    return {
      id: subscription.id.toString(),
      status: subscription.status,
      subscribedAt: subscription.subscribedAt.toISOString(),
      author: author ? { id: author.id.toString(), name: author.name } : null,
    }
  }
}
