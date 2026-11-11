import Image from 'next/image'
import Link from 'next/link'
import { getCuration } from '@/server/http/routes/curation/get-curation'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'
import type { Project } from '@/utils/type'

type RankedItem = {
  project: Project
  coverUrl: string | null
  detail: string
}

type CurationRankListProps = {
  title: string
  description: string
  items: RankedItem[]
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

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
          {items.map(({ project, coverUrl, detail }, index) => (
            <li key={project.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 shrink-0 text-center font-heading text-lg font-semibold">{index + 1}</span>

              <Link href={`/projetos/${project.slug}`} className="shrink-0">
                {coverUrl ? (
                  <div className="relative aspect-video w-28 overflow-hidden">
                    <Image src={coverUrl} alt={`Capa de ${project.title}`} fill unoptimized className="object-cover" />
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
                <p className="text-xs text-muted-foreground">{detail}</p>
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

export async function CurationLists({ institutionId, months }: CurationListsProps) {
  const { board, community } = await getCuration({ months, ...(institutionId ? { institutionId } : {}) })

  const boardItems = await Promise.all(
    board.map(async (entry) => ({
      project: entry.project,
      coverUrl: await resolveProjectCoverUrl(entry.project),
      detail: `Nota média ${numberFormatter.format(entry.teacherAverage)} (${entry.teacherRatingsCount} ${
        entry.teacherRatingsCount === 1 ? 'avaliação' : 'avaliações'
      })`,
    })),
  )

  const communityItems = await Promise.all(
    community.map(async (entry) => ({
      project: entry.project,
      coverUrl: await resolveProjectCoverUrl(entry.project),
      detail: `${numberFormatter.format(entry.weightedScore)} pontos (${entry.starsCount} ${
        entry.starsCount === 1 ? 'estrela' : 'estrelas'
      })`,
    })),
  )

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
