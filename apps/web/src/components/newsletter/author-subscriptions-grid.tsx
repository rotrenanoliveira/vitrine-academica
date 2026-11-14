import { AuthorSubscriptionCard } from '@/components/newsletter/author-subscription-card'
import type { MySubscriptionItem } from '@/utils/newsletter-type'

type AuthorSubscriptionsGridProps = {
  subscriptions: MySubscriptionItem[]
}

export function AuthorSubscriptionsGrid({ subscriptions }: AuthorSubscriptionsGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {subscriptions.map((subscription) => (
        <AuthorSubscriptionCard key={subscription.id} subscription={subscription} />
      ))}
    </div>
  )
}
