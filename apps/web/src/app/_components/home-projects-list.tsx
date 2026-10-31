import Image from 'next/image'
import Link from 'next/link'
import { ProjectStarButton } from '@/components/project/project-star-button'
import type { Project } from '@/utils/type'

type ProjectWithCover = Project & { coverUrl: string | null }

type HomeProjectsListProps = {
  projects: ProjectWithCover[]
  starredProjectIds?: string[]
  currentUserId?: string | null
  authenticated?: boolean
}

export function HomeProjectsList({
  projects,
  starredProjectIds = [],
  currentUserId = null,
  authenticated = false,
}: HomeProjectsListProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto publicado no momento.</p>
  }

  const starredSet = new Set(starredProjectIds)

  return (
    <ul className="divide-y divide-border border border-border">
      {projects.map((project) => {
        const starred = starredSet.has(project.id)
        const isOwner = Boolean(currentUserId && project.authorId === currentUserId)

        return (
          <li key={project.id} className="px-4 py-4">
            <div className="space-y-4 lg:flex lg:gap-4">
              <Link href={`/projetos/${project.id}`} className="block shrink-0">
                {project.coverUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden lg:w-96">
                    <Image
                      src={project.coverUrl}
                      alt={`Capa de ${project.title}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted lg:w-96" aria-hidden />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-heading text-lg font-medium">
                    <Link href={`/projetos/${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Publicado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="shrink-0">
                  <ProjectStarButton
                    projectId={project.id}
                    starred={starred}
                    authenticated={authenticated}
                    disabled={isOwner}
                    variant="icon"
                  />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function HomePreferencesBanner() {
  return (
    <div className="border border-border px-4 py-3 text-sm">
      <p>
        Você ainda não cadastrou tags preferidas.{' '}
        <Link href="/conta" className="font-medium underline-offset-4 hover:underline">
          Cadastre em Minha conta
        </Link>{' '}
        para personalizar a vitrine.
      </p>
    </div>
  )
}
