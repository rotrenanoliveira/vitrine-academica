'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useFormState } from '@/hook/use-form-state'
import { actionRateProjectByCriteria } from '@/server/actions/rate-project-by-criteria'
import { criterionShortLabel } from '@/utils/criterion-short-label'
import type { ProjectTeacherRating, RatingCriterion } from '@/utils/type'

type ProjectTeacherRatingFormProps = {
  projectId: string
  criteria: RatingCriterion[]
  initialRating: ProjectTeacherRating | null
  teacherName: string
}

export function ProjectTeacherRatingForm({
  projectId,
  criteria,
  initialRating,
  teacherName,
}: ProjectTeacherRatingFormProps) {
  const router = useRouter()
  const initialScores = useMemo(() => {
    const map = new Map<string, number>()

    for (const criterion of criteria) {
      const existing = initialRating?.items.find((item) => item.criterionId === criterion.id)
      map.set(criterion.id, existing?.score ?? 7)
    }

    return map
  }, [criteria, initialRating])

  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(initialScores))

  const [state, handleSubmit, isPending] = useFormState(actionRateProjectByCriteria, {
    onSuccess: () => router.refresh(),
  })

  const overall =
    criteria.length === 0
      ? 0
      : Math.round(
          (criteria.reduce((sum, criterion) => sum + (scores[criterion.id] ?? 0), 0) / criteria.length) * 100,
        ) / 100

  const scoresPayload = JSON.stringify(
    criteria.map((criterion) => ({
      criterionId: criterion.id,
      score: scores[criterion.id] ?? 0,
    })),
  )

  const initials = teacherName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Sua avaliação docente</p>
          <p className="text-xs text-muted-foreground">
            Notas de 0 a 10 em cada critério · média aritmética no Overall
          </p>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Salvando…' : initialRating ? 'Atualizar' : 'Publicar nota'}
        </Button>
      </div>

      <input type="hidden" name="project-id" value={projectId} />
      <input type="hidden" name="scores" value={scoresPayload} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-collapse text-sm">
          <thead>
            <tr className="text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-2 text-left font-normal">Avaliador</th>
              {criteria.map((criterion) => (
                <th
                  key={criterion.id}
                  className="w-28 px-2 py-2 text-center font-normal"
                  title={criterion.description ?? criterion.name}
                >
                  {criterionShortLabel(criterion.name)}
                </th>
              ))}
              <th className="w-28 bg-muted/60 px-3 py-2 text-center font-normal">Overall</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-dotted border-border">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {initials || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{teacherName}</p>
                    <p className="text-xs text-muted-foreground">Professor</p>
                  </div>
                </div>
              </td>
              {criteria.map((criterion) => (
                <td key={criterion.id} className="px-2 py-4 text-center">
                  <input
                    aria-label={criterion.name}
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={scores[criterion.id] ?? 0}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      const clamped = Number.isNaN(value) ? 0 : Math.min(10, Math.max(0, value))
                      setScores((current) => ({ ...current, [criterion.id]: clamped }))
                    }}
                    className="mx-auto w-16 border border-border bg-background px-2 py-1 text-center tabular-nums outline-none focus:border-foreground"
                  />
                </td>
              ))}
              <td className="bg-muted/60 px-3 py-4 text-center font-semibold tabular-nums">{overall.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {state.message ? (
        <p className={`px-4 pb-3 text-sm ${state.success ? 'text-muted-foreground' : 'text-destructive'}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
