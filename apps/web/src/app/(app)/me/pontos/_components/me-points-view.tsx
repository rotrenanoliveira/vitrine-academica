'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { MyPointsTransactions } from '@/components/points/my-points-transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyPointsBalance } from '@/server/http/routes/points/get-my-points-balance'
import { listMyStarredProjects } from '@/server/http/routes/projects/list-my-starred-projects'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/utils/point-type'

export function MePointsView() {
  const balanceQuery = useQuery({
    queryKey: ['me', 'points', 'balance'],
    queryFn: () => getMyPointsBalance(),
  })

  const starredQuery = useQuery({
    queryKey: ['me', 'starred-projects'],
    queryFn: () => listMyStarredProjects(),
  })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 p-4 py-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Pontos e apoios</h1>
          <p className="text-muted-foreground">
            Saldo, movimentações (apoios recebidos e promoções) e projetos que você apoiou.
          </p>
        </div>
        {balanceQuery.isPending ? (
          <Skeleton className="h-10 w-28 rounded-none bg-[#252422]/15" />
        ) : balanceQuery.isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o saldo de pontos.</p>
        ) : (
          <p className="text-4xl font-semibold tabular-nums tracking-tight">{balanceQuery.data.balance}</p>
        )}
        <div className="max-w-3xl space-y-2 text-sm text-muted-foreground">
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
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Movimentações</h2>
        <p className="text-sm text-muted-foreground">
          Créditos de estrela recebida (apoios recebidos) e débitos de promoção.
        </p>
        <MyPointsTransactions limit={100} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Projetos que apoiei</h2>
        <p className="text-sm text-muted-foreground">Lista dos projetos em que você deixou uma estrela.</p>
        {starredQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando projetos apoiados…</p>
        ) : starredQuery.isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar os projetos apoiados.</p>
        ) : starredQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não apoiou nenhum projeto.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {starredQuery.data.items.map(({ project, star }) => (
              <li key={star.id} className="flex flex-col gap-1 px-4 py-3">
                <Link href={`/projetos/${project.slug}`} className="font-heading text-lg font-semibold hover:underline">
                  {project.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Apoiado em {new Date(star.ratedAt).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
