import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ProjectStarButton } from '@/components/project/project-star-button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { getAttachment } from '@/server/http/routes/attachments/get-attachment'
import { getMyStarOnProject } from '@/server/http/routes/projects/get-my-star-on-project'
import { getProject } from '@/server/http/routes/projects/get-project'
import { getProjectRatings } from '@/server/http/routes/projects/get-project-ratings'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'

export const metadata: Metadata = {
  title: 'Projeto',
}

type PageProps = {
  params: Promise<{ id: string }>
}

const statusLabels = {
  SKETCH: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
} as const

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireUser()

  const [{ project }, { rating }, { tags: allTags }] = await Promise.all([
    getProject(id),
    getProjectRatings(id),
    getCachedTags(),
  ])

  const isOwner = user.id === project.authorId
  const canStar = project.status === 'PUBLISHED' && !isOwner

  const [coverUrl, myStarResult, attachmentEntries] = await Promise.all([
    resolveProjectCoverUrl(project),
    canStar || project.status === 'PUBLISHED' ? getMyStarOnProject(id) : Promise.resolve({ star: null }),
    Promise.all(
      project.attachments.map(async (attachmentId) => {
        const [result] = await getAttachment(attachmentId)
        if (!result) return null
        return { id: attachmentId, ...result }
      }),
    ),
  ])

  const projectTags = allTags.filter((tag) => project.tags.includes(tag.id))
  const attachments = attachmentEntries.filter((item): item is NonNullable<typeof item> => item !== null)
  const starred = Boolean(myStarResult.star)

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
              <BreadcrumbPage>Vitrine</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 py-8">
        {coverUrl ? (
          <div className="relative aspect-video w-full overflow-hidden border border-border">
            <Image src={coverUrl} alt={`Capa de ${project.title}`} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted" aria-hidden />
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs tracking-wider text-muted-foreground uppercase">{statusLabels[project.status]}</p>
            <h1 className="font-heading text-3xl font-semibold">{project.title}</h1>
            <p className="text-xs text-muted-foreground">
              Publicado em {new Date(project.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>

          {project.status === 'PUBLISHED' && (
            <div className="flex flex-col items-end gap-2">
              <ProjectStarButton
                projectId={project.id}
                starred={starred}
                starsCount={rating.starsCount}
                disabled={isOwner}
                variant="detail"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">Sobre o projeto</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
        </div>

        {projectTags.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold">Tags</h2>
            <ul className="flex flex-wrap gap-2">
              {projectTags.map((tag) => (
                <li key={tag.id} className="border border-border px-3 py-1 text-xs tracking-wider uppercase">
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Anexos</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {attachments.map((item) => {
                const isImage = item.attachment.mimeType.startsWith('image/')

                return (
                  <li key={item.id} className="border border-border">
                    {isImage ? (
                      <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="block">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={item.attachmentUrl}
                            alt={item.attachment.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <p className="truncate px-3 py-2 text-xs text-muted-foreground">{item.attachment.name}</p>
                      </a>
                    ) : (
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 px-3 py-3 text-sm hover:underline"
                      >
                        <span className="truncate">{item.attachment.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">Abrir</span>
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {isOwner && (
          <>
            {project.status === 'PUBLISHED' && (
              <div className="flex flex-wrap gap-6 border border-border p-4 text-sm">
                <div>
                  <p className="text-xs tracking-wider text-muted-foreground uppercase">Apoios</p>
                  <p className="font-heading text-xl font-semibold tabular-nums">{rating.starsCount}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wider text-muted-foreground uppercase">Score ponderado</p>
                  <p className="font-heading text-xl font-semibold tabular-nums">{rating.starsWeightedScore}</p>
                </div>
              </div>
            )}

            <div>
              <Button nativeButton={false} variant="outline" render={<Link href={`/projetos/${project.id}/editar`} />}>
                Gerenciar / Editar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
