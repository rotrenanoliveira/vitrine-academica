'use client'

import { useQuery } from '@tanstack/react-query'
import { MeSection } from '@/components/me/me-section'
import { MyPointsTransactions } from '@/components/points/my-points-transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyPointsBalance } from '@/server/http/routes/points/get-my-points-balance'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/utils/point-type'

export function MePointsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'points', 'balance'],
    queryFn: () => getMyPointsBalance(),
  })

  return (
    <MeSection
      id="me-pontos"
      eyebrow="pontos"
      title="Sistema de pontos"
      href="/me/pontos"
      linkLabel="Ver histórico e apoios"
    >
      <div className="space-y-4">
        {isPending ? (
          <Skeleton className="h-9 w-24 rounded-none bg-[#252422]/15" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o saldo de pontos.</p>
        ) : (
          <p className="text-3xl font-semibold tabular-nums tracking-tight">{data.balance}</p>
        )}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Você ganha pontos quando o seu projeto (ou um projeto em que é coautor com convite aceito) recebe a primeira
            estrela de alguém. Remover e dar a estrela de novo não gera pontos novos.
          </p>
          <p>
            O peso da estrela é <span className="font-medium text-foreground">1</span> para usuário comum e aluno, e{' '}
            <span className="font-medium text-foreground">5</span> para professor ou docente com vínculo institucional
            ativo.
          </p>
          <p>
            Promover um projeto custa <span className="font-medium text-foreground tabular-nums">{PROMOTION_COST}</span>{' '}
            pontos e permanece em destaque por {PROMOTION_DURATION_DAYS} dias.
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Movimentações recentes</h3>
          <MyPointsTransactions limit={3} />
        </div>
      </div>
    </MeSection>
  )
}
