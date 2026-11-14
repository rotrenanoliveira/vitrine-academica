'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { listActiveRatingCriteria } from '@/server/http/routes/projects/list-active-rating-criteria'
import { listMyTeacherRatings } from '@/server/http/routes/projects/list-my-teacher-ratings'

export function MeRatingsList() {
  const ratingsQuery = useQuery({
    queryKey: ['me', 'teacher-ratings'],
    queryFn: () => listMyTeacherRatings(),
  })

  const criteriaQuery = useQuery({
    queryKey: ['rating-criteria'],
    queryFn: () => listActiveRatingCriteria(),
  })

  if (ratingsQuery.isPending || criteriaQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Carregando avaliações…</p>
  }

  if (ratingsQuery.isError || criteriaQuery.isError || !ratingsQuery.data || !criteriaQuery.data) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar as avaliações.</p>
  }

  const criterionNames = new Map(criteriaQuery.data.criteria.map((criterion) => [criterion.id, criterion.name]))
  const items = ratingsQuery.data.items

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Você ainda não avaliou nenhum projeto.</p>
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {items.map(({ project, rating }) => (
        <li key={rating.id} className="flex flex-col gap-3 px-4 py-4">
          <div className="space-y-1">
            <Link href={`/projetos/${project.slug}`} className="font-heading text-lg font-semibold hover:underline">
              {project.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              Avaliado em {new Date(rating.ratedAt).toLocaleString('pt-BR')} · média {rating.overallScore.toFixed(1)}
            </p>
          </div>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {rating.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 text-muted-foreground">
                <span>{criterionNames.get(item.criterionId) ?? 'Critério'}</span>
                <span className="tabular-nums text-foreground">{item.score.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
