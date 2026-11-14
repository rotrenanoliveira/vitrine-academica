'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { AuthorSubscriptionsGrid } from '@/components/newsletter/author-subscriptions-grid'
import { listMySubscriptions } from '@/server/http/routes/newsletter/list-my-subscriptions'

export function MeAuthorsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'subscriptions', { status: 'ACTIVE' }],
    queryFn: () => listMySubscriptions({ status: 'ACTIVE' }),
  })

  if (isPending) {
    return <MeCardsSkeleton count={6} />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os autores que você acompanha.</p>
  }

  if (data.subscriptions.length === 0) {
    return <p className="text-sm text-muted-foreground">Você ainda não acompanha nenhum autor.</p>
  }

  return <AuthorSubscriptionsGrid subscriptions={data.subscriptions} />
}
