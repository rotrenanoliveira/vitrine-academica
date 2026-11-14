import Image from 'next/image'
import Link from 'next/link'
import { getCuration } from '@/server/http/routes/curation/get-curation'
import type { ProjectListItem } from '@/utils/type'

type RankedItem = {
  project: ProjectListItem
  detail: string
}

type CurationRankListProps = {
  title: string
  description: string
  items: RankedItem[]
}

function CurationRankList({ title, description, items }: CurationRankListProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum projeto avaliado neste período.</p>
      ) : (
        <ol className="divide-y divide-border border border-border">
          {items.map(({ project, detail }, index) => (
            <li key={project.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 shrink-0 text-center font-heading text-lg font-semibold">{index + 1}</span>

              <Link href={`/projetos/${project.slug}`} className="shrink-0">
                {project.coverUrl ? (
                  <div className="relative aspect-video w-28 overflow-hidden">
                    <Image
                      src={project.coverUrl}
                      alt={`Capa de ${project.title}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-28 bg-muted" aria-hidden />
                )}
              </Link>

              <div className="min-w-0 space-y-1">
                <h3 className="truncate font-medium">
                  <Link href={`/projetos/${project.slug}`} className="hover:underline">
                    {project.title}
                  </Link>
                </h3>
                {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

type CurationListsProps = {
  institutionId?: string | undefined
  months: number
}

function toRankedItems(projects: ProjectListItem[]): RankedItem[] {
  return projects.map((project) => ({
    project,
    detail: project.tags.length > 0 ? project.tags.join(' · ') : '',
  }))
}

export async function CurationLists({ institutionId, months }: CurationListsProps) {
  const sharedParams = {
    months,
    ...(institutionId ? { institutionId } : {}),
  }

  const [board, community] = await Promise.all([
    getCuration({ ...sharedParams, scope: 'board' }),
    getCuration({ ...sharedParams, scope: 'community' }),
  ])

  const boardItems = toRankedItems(board.projects)
  const communityItems = toRankedItems(community.projects)

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CurationRankList
        title="Banca de professores"
        description="Projetos melhor avaliados pelos docentes, pela nota média"
        items={boardItems}
      />
      <CurationRankList
        title="Comunidade"
        description="Projetos mais bem avaliados por alunos e demais usuários, pelos pontos das estrelas"
        items={communityItems}
      />
    </div>
  )
}
