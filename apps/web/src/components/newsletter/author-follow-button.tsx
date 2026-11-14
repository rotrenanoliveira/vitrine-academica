'use client'

import { BellIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { cn } from '@/lib/utils'
import { actionSubscribeToAuthor } from '@/server/actions/subscribe-to-author'
import { actionUnsubscribeFromAuthor } from '@/server/actions/unsubscribe-from-author'

type AuthorFollowButtonProps = {
  authorId: string
  subscriptionId?: string | null
  following: boolean
  authenticated?: boolean
  disabled?: boolean
  className?: string
}

export function AuthorFollowButton({
  authorId,
  subscriptionId,
  following,
  authenticated = true,
  disabled,
  className,
}: AuthorFollowButtonProps) {
  const queryClient = useQueryClient()
  const action = following ? actionUnsubscribeFromAuthor : actionSubscribeToAuthor

  const [_, handleSubmit, isPending] = useFormState(action, {
    onSuccess: (message) => {
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'subscriptions'] })
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (!authenticated) {
    return (
      <Button
        nativeButton={false}
        variant="outline"
        render={<Link href="/sign-in" />}
        className={cn('gap-2', className)}
      >
        <HugeiconsIcon icon={BellIcon} className="size-4" />
        <span>Entrar para acompanhar</span>
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="author-id" value={authorId} />
      {following && subscriptionId ? <input type="hidden" name="subscription-id" value={subscriptionId} /> : null}
      <Button
        type="submit"
        variant="outline"
        disabled={disabled || isPending || (following && !subscriptionId)}
        className={cn('gap-2', className)}
      >
        {isPending ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
        ) : (
          <HugeiconsIcon icon={BellIcon} className="size-4" />
        )}
        <span>{following ? 'Deixar de acompanhar' : 'Acompanhar'}</span>
      </Button>
    </form>
  )
}
