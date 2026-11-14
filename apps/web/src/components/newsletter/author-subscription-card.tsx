'use client'

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionUnsubscribeFromAuthor } from '@/server/actions/unsubscribe-from-author'
import type { MySubscriptionItem } from '@/utils/newsletter-type'

type AuthorSubscriptionCardProps = {
  subscription: MySubscriptionItem
}

export function AuthorSubscriptionCard({ subscription }: AuthorSubscriptionCardProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [_, handleSubmit, isPending] = useFormState(actionUnsubscribeFromAuthor, {
    onSuccess: (message) => {
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'subscriptions'] })
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  const authorName = subscription.author?.name ?? 'Autor removido'
  const authorHref = subscription.author ? `/p/${subscription.author.id}` : undefined

  return (
    <BeigeActionCard
      title={
        authorHref ? (
          <Link href={authorHref} className="underline-offset-4 hover:underline">
            {authorName}
          </Link>
        ) : (
          <span className="text-muted-foreground">{authorName}</span>
        )
      }
      meta={<p>Desde {new Date(subscription.subscribedAt).toLocaleDateString('pt-BR')}</p>}
      description={<p>Receba e-mails quando este autor publicar novos projetos.</p>}
      actions={
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="subscription-id" value={subscription.id} />
          {subscription.author ? <input type="hidden" name="author-id" value={subscription.author.id} /> : null}
          <Button type="submit" variant="outline" size="sm" disabled={isPending} className="w-full gap-2">
            {isPending ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
            Deixar de acompanhar
          </Button>
        </form>
      }
    />
  )
}
