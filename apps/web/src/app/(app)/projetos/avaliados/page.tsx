import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { listActiveRatingCriteria } from '@/server/http/routes/projects/list-active-rating-criteria'
import { listMyTeacherRatings } from '@/server/http/routes/projects/list-my-teacher-ratings'

export const metadata: Metadata = {
  title: 'Projetos que avaliei',
}

export default async function RatedProjectsPage() {
  await requireUser()
  const [{ items }, { criteria }] = await Promise.all([listMyTeacherRatings(), listActiveRatingCriteria()])

  const criterionNames = new Map(criteria.map((criterion) => [criterion.id, criterion.name]))

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projetos" />}>Projetos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Avaliados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Projetos que avaliei</h1>
          <p className="text-muted-foreground">
            Lista dos projetos em que você registrou avaliação docente, com média e notas por critério.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não avaliou nenhum projeto.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {items.map(({ project, rating }) => (
              <li key={rating.id} className="flex flex-col gap-3 px-4 py-4">
                <div className="space-y-1">
                  <Link href={`/projetos/${project.id}`} className="font-heading text-lg font-semibold hover:underline">
                    {project.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Avaliado em {new Date(rating.ratedAt).toLocaleString('pt-BR')} · média{' '}
                    {rating.overallScore.toFixed(1)}
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
        )}
      </div>
    </div>
  )
}
