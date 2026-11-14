import { criterionShortLabel } from '@/utils/criterion-short-label'
import type { ProjectTeacherRating, RatingCriterion } from '@/utils/type'

type VoteItem = {
  teacher: {
    id: string
    name: string
  }
  rating: ProjectTeacherRating
}

type ProjectTeacherVotesTableProps = {
  criteria: RatingCriterion[]
  items: VoteItem[]
  teacherAverage: number | null
  ratingsCount: number
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
}

function scoreForCriterion(rating: ProjectTeacherRating, criterionId: string) {
  return rating.items.find((item) => item.criterionId === criterionId)?.score
}

export function ProjectTeacherVotesTable({
  criteria,
  items,
  teacherAverage,
  ratingsCount,
}: ProjectTeacherVotesTableProps) {
  if (criteria.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Avaliações</p>
          <p className="border-b-2 border-foreground pb-2 text-sm font-medium">Professores</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {ratingsCount} {ratingsCount === 1 ? 'avaliação' : 'avaliações'}
          {teacherAverage !== null ? ` · média ${teacherAverage.toFixed(2)}` : null}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-collapse text-sm">
          <thead>
            <tr className="text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-3 pr-4 text-left font-normal">Avaliador</th>
              {criteria.map((criterion) => (
                <th key={criterion.id} className="w-24 px-2 py-3 text-center font-normal" title={criterion.name}>
                  {criterionShortLabel(criterion.name)}
                </th>
              ))}
              <th className="w-28 bg-muted/60 px-3 py-3 text-center font-normal">Overall</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={criteria.length + 2} className="py-8 text-center text-muted-foreground">
                  Nenhuma avaliação docente ainda.
                </td>
              </tr>
            ) : (
              items.map(({ teacher, rating }) => (
                <tr key={rating.id} className="border-t border-dotted border-border">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tracking-wide"
                        aria-hidden
                      >
                        {initials(teacher.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Avaliado em {new Date(rating.ratedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </td>
                  {criteria.map((criterion) => {
                    const score = scoreForCriterion(rating, criterion.id)
                    return (
                      <td key={criterion.id} className="px-2 py-4 text-center tabular-nums text-muted-foreground">
                        {score === undefined ? '—' : Number.isInteger(score) ? score : score.toFixed(1)}
                      </td>
                    )
                  })}
                  <td className="bg-muted/60 px-3 py-4 text-center font-semibold tabular-nums">
                    {rating.overallScore.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
