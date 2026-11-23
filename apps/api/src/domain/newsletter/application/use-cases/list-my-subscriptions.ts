import { type Either, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import { type AuthorSubscription, SubscriptionStatus } from '../../enterprise/entities/author-subscription'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'

interface ListMySubscriptionsUseCaseRequest {
  subscriberId: string
  status?: SubscriptionStatus | undefined
}

export interface SubscriptionItem {
  subscription: AuthorSubscription
  author: User | null
}

type ListMySubscriptionsUseCaseResponse = Either<never, { subscriptions: SubscriptionItem[] }>

export class ListMySubscriptionsUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
  ) {}

  async execute({
    subscriberId,
    status = SubscriptionStatus.ACTIVE,
  }: ListMySubscriptionsUseCaseRequest): Promise<ListMySubscriptionsUseCaseResponse> {
    const subscriptions = await this.subscriptionsRepository.findManyBySubscriberId(subscriberId, status)

    const items = await this.attachAuthors(subscriptions)

    return right({ subscriptions: items })
  }

  private async attachAuthors(subscriptions: AuthorSubscription[]): Promise<SubscriptionItem[]> {
    const authors = await Promise.all(
      subscriptions.map((subscription) => this.usersRepository.findById(subscription.authorId.toString())),
    )

    return subscriptions.map((subscription, index) => ({
      subscription,
      author: authors[index] ?? null,
    }))
  }
}
