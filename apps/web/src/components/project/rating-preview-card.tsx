import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import type { TeacherRatedProjectItem } from '@/utils/type'

type RatingPreviewCardProps = {
  item: TeacherRatedProjectItem
}

export function RatingPreviewCard({ item }: RatingPreviewCardProps) {
  const { project, rating } = item

  return (
    <BeigeActionCard
      title={
        <Link href={`/projetos/${project.slug}`} className="underline-offset-4 hover:underline">
          {project.title}
        </Link>
      }
      meta={
        <>
          <p>Média {rating.overallScore.toFixed(1)}</p>
          <p>Avaliado em {new Date(rating.ratedAt).toLocaleDateString('pt-BR')}</p>
        </>
      }
      description={<p className="line-clamp-3">{project.description}</p>}
    />
  )
}
