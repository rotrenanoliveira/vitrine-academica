'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormState } from '@/hook/use-form-state'
import { actionUnsubscribeFromAuthor } from '@/server/actions/unsubscribe-from-author'
import { listMySubscriptions } from '@/server/http/routes/newsletter/list-my-subscriptions'
import type { MySubscriptionItem } from '@/utils/newsletter-type'

function UnsubscribeRowButton({ subscription }: { subscription: MySubscriptionItem }) {
  const queryClient = useQueryClient()

  const [_, handleSubmit, isPending] = useFormState(actionUnsubscribeFromAuthor, {
    onSuccess: (message) => {
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'subscriptions'] })
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="subscription-id" value={subscription.id} />
      {subscription.author ? <input type="hidden" name="author-id" value={subscription.author.id} /> : null}
      <Button type="submit" variant="outline" size="sm" disabled={isPending} className="gap-2">
        {isPending ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
        Deixar de acompanhar
      </Button>
    </form>
  )
}

function MySubscriptionsSkeleton() {
  return (
    <ul className="space-y-4" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded-none bg-[#252422]/15" />
            <Skeleton className="h-3 w-28 rounded-none bg-[#252422]/10" />
          </div>
          <Skeleton className="h-8 w-36 rounded-none bg-[#252422]/15" />
        </li>
      ))}
    </ul>
  )
}

export function MySubscriptionsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'subscriptions', { status: 'ACTIVE' }],
    queryFn: () => listMySubscriptions({ status: 'ACTIVE' }),
  })

  if (isPending) {
    return <MySubscriptionsSkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os autores que você acompanha.</p>
  }

  const subscriptions = data.subscriptions

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não acompanha nenhum autor. Ao acompanhar, receberá e-mails quando novos projetos forem publicados.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {subscriptions.map((subscription) => (
        <li
          key={subscription.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
        >
          <div className="min-w-0 space-y-1">
            {subscription.author ? (
              <Link href={`/p/${subscription.author.id}`} className="font-medium underline-offset-4 hover:underline">
                {subscription.author.name}
              </Link>
            ) : (
              <p className="font-medium text-muted-foreground">Autor removido</p>
            )}
            <p className="text-xs text-muted-foreground">
              Desde {new Date(subscription.subscribedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <UnsubscribeRowButton subscription={subscription} />
        </li>
      ))}
    </ul>
  )
}
