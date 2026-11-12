import type { Metadata } from 'next'
import { DestaquesFilters } from '../_components/destaques-filters'
import { DestaquesHeader } from '../_components/destaques-header'
import { DestaquesTypeList } from '../_components/destaques-type-list'

export const metadata: Metadata = {
  title: 'Destaques da comunidade',
  description: 'Projetos mais bem avaliados por alunos e demais usuários',
}

const allowedMonths = [1, 3, 6, 12]
const defaultMonths = 3

type PageProps = {
  searchParams: Promise<{
    title?: string
    institutionId?: string
    tags?: string | string[]
    months?: string
  }>
}

function normalizeTagIds(tags: string | string[] | undefined) {
  if (!tags) return undefined
  const list = Array.isArray(tags) ? tags : [tags]
  return list.length > 0 ? list : undefined
}

export default async function DestaquesComunidadePage({ searchParams }: PageProps) {
  const params = await searchParams
  const title = params.title?.trim() || undefined
  const institutionId = params.institutionId || undefined
  const tagIds = normalizeTagIds(params.tags)
  const requestedMonths = Number(params.months)
  const months = allowedMonths.includes(requestedMonths) ? requestedMonths : defaultMonths

  return (
    <div className="space-y-6">
      <DestaquesHeader />
      <DestaquesFilters title={title} institutionId={institutionId} tagIds={tagIds} months={months} />
      <DestaquesTypeList
        type="community"
        title={title}
        institutionId={institutionId}
        tagIds={tagIds}
        months={months}
      />
    </div>
  )
}
