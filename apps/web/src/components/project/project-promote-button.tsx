'use client'

import { Loading03Icon, Rocket01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { cn } from '@/lib/utils'
import { actionPromoteProject } from '@/server/actions/promote-project'
import { getMyPointsBalance } from '@/server/http/routes/points/get-my-points-balance'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/utils/point-type'

type ProjectPromoteButtonProps = {
  projectId: string
  projectSlug: string
  disabled?: boolean
  className?: string
}

export function ProjectPromoteButton({ projectId, projectSlug, disabled, className }: ProjectPromoteButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data, isPending: isBalancePending } = useQuery({
    queryKey: ['me', 'points', 'balance'],
    queryFn: getMyPointsBalance,
    enabled: open,
  })

  const balance = data?.balance ?? 0
  const canAfford = balance >= PROMOTION_COST

  const [_, handleSubmit, isPending] = useFormState(actionPromoteProject, {
    onSuccess: (message) => {
      toast.success(message)
      void queryClient.invalidateQueries({ queryKey: ['me', 'points'] })
      void queryClient.invalidateQueries({ queryKey: ['promotions', 'active'] })
      setOpen(false)
      router.refresh()
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" disabled={disabled} className={cn('gap-2', className)} />}
      >
        <HugeiconsIcon icon={Rocket01Icon} className="size-4" />
        <span>Promover</span>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promover projeto</AlertDialogTitle>
          <AlertDialogDescription>
            Promover este projeto custa{' '}
            <span className="font-medium text-foreground tabular-nums">{PROMOTION_COST}</span> pontos e o mantém em
            destaque por {PROMOTION_DURATION_DAYS} dias na home e na lista de promovidos. Você não pode promover o seu
            próprio projeto.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 text-sm">
          {isBalancePending ? (
            <p className="text-muted-foreground">Carregando saldo…</p>
          ) : (
            <>
              <p>
                Seu saldo atual: <span className="font-medium tabular-nums text-foreground">{balance}</span> pontos
              </p>
              {!canAfford ? (
                <p className="text-muted-foreground">
                  Saldo insuficiente.{' '}
                  <Link href="/conta" className="underline underline-offset-4 hover:text-foreground">
                    Ver como obter pontos
                  </Link>
                  .
                </p>
              ) : null}
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="project-id" value={projectId} />
            <input type="hidden" name="project-slug" value={projectSlug} />
            <AlertDialogAction type="submit" disabled={disabled || isPending || isBalancePending || !canAfford}>
              {isPending ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
              Confirmar promoção
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
