'use client'

import { Loading03Icon, StarIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { cn } from '@/lib/utils'
import { actionStarProject } from '@/server/actions/star-project'
import { actionUnstarProject } from '@/server/actions/unstar-project'

type ProjectStarButtonProps = {
  projectId: string
  starred: boolean
  starsCount?: number
  disabled?: boolean
  /** When false, renders a sign-in link instead of mutating. */
  authenticated?: boolean
  variant?: 'icon' | 'detail'
  className?: string
}

function StarGlyph({ starred, pending, size = 'size-5' }: { starred: boolean; pending?: boolean; size?: string }) {
  if (pending) {
    return <HugeiconsIcon icon={Loading03Icon} className={cn(size, 'animate-spin')} />
  }

  return (
    <HugeiconsIcon
      icon={StarIcon}
      className={cn(size, starred ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground')}
      strokeWidth={starred ? 0 : 2}
    />
  )
}

export function ProjectStarButton({
  projectId,
  starred,
  starsCount,
  disabled,
  authenticated = true,
  variant = 'detail',
  className,
}: ProjectStarButtonProps) {
  const router = useRouter()
  const action = starred ? actionUnstarProject : actionStarProject

  const [_, handleSubmit, isPending] = useFormState(action, {
    onSuccess: () => router.refresh(),
  })

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation()
  }

  if (!authenticated) {
    if (variant === 'icon') {
      return (
        <Link
          href="/sign-in"
          aria-label="Entrar para apoiar com estrela"
          onClick={stopPropagation}
          className={cn(
            'inline-flex size-10 items-center justify-center border border-transparent hover:bg-muted',
            className,
          )}
        >
          <StarGlyph starred={false} />
        </Link>
      )
    }

    return (
      <Button
        nativeButton={false}
        variant="outline"
        render={<Link href="/sign-in" />}
        className={cn('gap-2', className)}
      >
        <StarGlyph starred={false} size="size-4" />
        <span>Entrar para apoiar</span>
        {typeof starsCount === 'number' ? <span className="tabular-nums opacity-80">{starsCount}</span> : null}
      </Button>
    )
  }

  if (variant === 'icon') {
    return (
      <form onSubmit={handleSubmit} onClick={stopPropagation}>
        <input type="hidden" name="project-id" value={projectId} />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={disabled || isPending}
          aria-label={starred ? 'Remover apoio' : 'Apoiar com estrela'}
          aria-pressed={starred}
          className={className}
        >
          <StarGlyph starred={starred} pending={isPending} />
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} onClick={stopPropagation}>
      <input type="hidden" name="project-id" value={projectId} />
      <Button
        type="submit"
        variant="outline"
        disabled={disabled || isPending}
        aria-pressed={starred}
        className={cn('gap-2', className)}
      >
        <StarGlyph starred={starred} pending={isPending} size="size-4" />
        {/* <span>{starred ? 'Apoiando' : 'Apoiar'}</span> */}
        {typeof starsCount === 'number' ? <span className="tabular-nums opacity-80">{starsCount}</span> : null}
      </Button>
    </form>
  )
}
