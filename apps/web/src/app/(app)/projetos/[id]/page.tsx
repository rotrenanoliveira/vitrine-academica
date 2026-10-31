import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ProjectStarButton } from '@/components/project/project-star-button'
import { ProjectTeacherRatingForm } from '@/components/project/project-teacher-rating-form'
import { ProjectTeacherVotesTable } from '@/components/project/project-teacher-votes-table'
import { FormPublishProject } from '@/components/project/form-publish-project'
import { FormScheduleProject } from '@/components/project/form-schedule-project'
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
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { getMyStarOnProject } from '@/server/http/routes/projects/get-my-star-on-project'
import { getMyTeacherRatingOnProject } from '@/server/http/routes/projects/get-my-teacher-rating-on-project'
import { getProject } from '@/server/http/routes/projects/get-project'
import { getProjectRatings } from '@/server/http/routes/projects/get-project-ratings'
import { listActiveRatingCriteria } from '@/server/http/routes/projects/list-active-rating-criteria'
import { listProjectTeacherRatings } from '@/server/http/routes/projects/list-project-teacher-ratings'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'
import { canRateAsTeacher } from '@/utils/can-rate-as-teacher'

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

  const [{ project }, { rating }, { tags: allTags }, { members }] = await Promise.all([
    getProject(id),
    getProjectRatings(id),
    getCachedTags(),
    getCachedMyInstitutionMemberships(user.id),
  ])

  const isOwner = user.id === project.authorId
  const canStar = project.status === 'PUBLISHED' && !isOwner
  const canRate = project.status === 'PUBLISHED' && !isOwner && canRateAsTeacher(members)

  const [coverUrl, myStarResult, attachmentEntries, votesResult, criteriaForForm, myTeacherRatingResult] =
    await Promise.all([
      resolveProjectCoverUrl(project),
      canStar || project.status === 'PUBLISHED' ? getMyStarOnProject(id) : Promise.resolve({ star: null }),
      Promise.all(
        project.attachments.map(async (attachmentId) => {
          const [result] = await getAttachment(attachmentId)
          if (!result) return null
          return { id: attachmentId, ...result }
        }),
      ),
      project.status === 'PUBLISHED' ? listProjectTeacherRatings(id) : Promise.resolve({ criteria: [], items: [] }),
      canRate ? listActiveRatingCriteria() : Promise.resolve({ criteria: [] }),
      canRate ? getMyTeacherRatingOnProject(id) : Promise.resolve({ teacherRating: null }),
    ])

  const projectTags = allTags.filter((tag) => project.tags.includes(tag.id))
  const attachments = attachmentEntries.filter((item): item is NonNullable<typeof item> => item !== null)
  const starred = Boolean(myStarResult.star)
  const myTeacherRating = myTeacherRatingResult.teacherRating
  const voteCriteria = votesResult.criteria.length > 0 ? votesResult.criteria : criteriaForForm.criteria
  const canEdit = isOwner
  const canSchedule = isOwner && project.status === 'SKETCH'
  const canPublish = isOwner && (project.status === 'SKETCH' || project.status === 'SCHEDULED')

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
              {rating.teacherAverage !== null && (
                <p className="text-sm text-muted-foreground">
                  Overall docente{' '}
                  <span className="font-semibold tabular-nums text-foreground">{rating.teacherAverage.toFixed(2)}</span>
                </p>
              )}
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

        {project.status === 'PUBLISHED' && (
          <div className="space-y-6">
            <ProjectTeacherVotesTable
              criteria={voteCriteria}
              items={votesResult.items}
              teacherAverage={rating.teacherAverage}
              ratingsCount={rating.teacherRatingsCount}
            />

            {canRate && criteriaForForm.criteria.length > 0 && (
              <ProjectTeacherRatingForm
                projectId={project.id}
                criteria={criteriaForForm.criteria}
                initialRating={myTeacherRating}
                teacherName={user.name}
              />
            )}
          </div>
        )}

        {isOwner && (
          <div>
            <Button nativeButton={false} variant="outline" render={<Link href={`/projetos/${project.id}/editar`} />}>
              Gerenciar / Editar
            </Button>
          </div>
        )}

        {canPublish && (
          <div className="border border-border p-4">
            <FormPublishProject projectId={project.id} />
          </div>
        )}
      </div>
    </div>
  )
}
