'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { listMyPointTransactions } from '@/server/http/routes/points/list-my-point-transactions'
import type { PointTransaction } from '@/utils/point-type'

const reasonLabels: Record<PointTransaction['reason'], string> = {
  STAR_RECEIVED: 'Estrela recebida',
  PROMOTION: 'Promoção de projeto',
}

function MyPointsTransactionsSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-none bg-[#252422]/15" />
            <Skeleton className="h-3 w-24 rounded-none bg-[#252422]/10" />
          </div>
          <Skeleton className="h-4 w-12 rounded-none bg-[#252422]/15" />
        </li>
      ))}
    </ul>
  )
}

export function MyPointsTransactions() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'points', 'transactions', { limit: 5 }],
    queryFn: () => listMyPointTransactions({ limit: 5 }),
  })

  if (isPending) {
    return <MyPointsTransactionsSkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico de pontos.</p>
  }

  const transactions = data.transactions

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há movimentações. Você ganha pontos quando o seu projeto recebe a primeira estrela de alguém.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {transactions.map((transaction) => {
        const isCredit = transaction.type === 'CREDIT'
        const signedAmount = isCredit ? `+${transaction.amount}` : `−${transaction.amount}`

        return (
          <li key={transaction.id} className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{reasonLabels[transaction.reason]}</p>
              <p className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <span
              className={`shrink-0 text-sm tabular-nums font-medium ${isCredit ? 'text-emerald-700' : 'text-foreground'}`}
            >
              {signedAmount}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
