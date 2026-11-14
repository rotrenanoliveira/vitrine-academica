import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FormInviteProjectMember } from '@/components/project/form-invite-project-member'
import { FormPublishProject } from '@/components/project/form-publish-project'
import { FormScheduleProject } from '@/components/project/form-schedule-project'
import { ProjectAuthors } from '@/components/project/project-authors'
import { ProjectCoverFrame } from '@/components/project/project-cover-frame'
import { ProjectPromoteButton } from '@/components/project/project-promote-button'
import { ProjectStarButton } from '@/components/project/project-star-button'
import { ProjectTeacherRatingForm } from '@/components/project/project-teacher-rating-form'
import { ProjectTeacherVotesTable } from '@/components/project/project-teacher-votes-table'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/server/auth/require-user'
import { getAttachment } from '@/server/http/routes/attachments/get-attachment'
import { fetchAuthorProjectsSafe } from '@/server/http/routes/authors/fetch-author-projects'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { getMyStarOnProject } from '@/server/http/routes/projects/get-my-star-on-project'
import { getMyTeacherRatingOnProject } from '@/server/http/routes/projects/get-my-teacher-rating-on-project'
import { getProjectBySlug } from '@/server/http/routes/projects/get-project-by-slug'
import { getProjectRatings } from '@/server/http/routes/projects/get-project-ratings'
import { listActiveRatingCriteria } from '@/server/http/routes/projects/list-active-rating-criteria'
import { listProjectMembers } from '@/server/http/routes/projects/list-project-members'
import { listProjectTeacherRatings } from '@/server/http/routes/projects/list-project-teacher-ratings'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'
import { canRateAsTeacher } from '@/utils/can-rate-as-teacher'

export const metadata: Metadata = {
  title: 'Projeto',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

const statusLabels = {
  SKETCH: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
} as const

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  const { project } = await getProjectBySlug(slug)
  const projectId = project.id

  const [{ rating }, { tags: allTags }, { members }, [authorData]] = await Promise.all([
    getProjectRatings(projectId),
    getCachedTags(),
    listProjectMembers({ projectId }),
    fetchAuthorProjectsSafe(project.authorId),
  ])

  const isAuthenticated = user !== null
  const isOwner = user !== null && user.id === project.authorId
  const memberships = user ? (await getCachedMyInstitutionMemberships(user.id)).members : []
  const canStar = isAuthenticated && project.status === 'PUBLISHED' && !isOwner
  const canRate = isAuthenticated && project.status === 'PUBLISHED' && !isOwner && canRateAsTeacher(memberships)

  const [coverUrl, myStarResult, attachmentEntries, votesResult, criteriaForForm, myTeacherRatingResult] =
    await Promise.all([
      resolveProjectCoverUrl(project),
      canStar || (isAuthenticated && project.status === 'PUBLISHED')
        ? getMyStarOnProject(projectId)
        : Promise.resolve({ star: null }),
      Promise.all(
        project.attachments.map(async (attachmentId) => {
          const [result] = await getAttachment(attachmentId)
          if (!result) return null
          return { id: attachmentId, ...result }
        }),
      ),
      project.status === 'PUBLISHED'
        ? listProjectTeacherRatings(projectId)
        : Promise.resolve({ criteria: [], items: [] }),
      canRate ? listActiveRatingCriteria() : Promise.resolve({ criteria: [] }),
      canRate ? getMyTeacherRatingOnProject(projectId) : Promise.resolve({ teacherRating: null }),
    ])

  const projectTags = allTags.filter((tag) => project.tags.includes(tag.id))
  const attachments = attachmentEntries.filter((item): item is NonNullable<typeof item> => item !== null)
  const starred = Boolean(myStarResult.star)
  const myTeacherRating = myTeacherRatingResult.teacherRating
  const voteCriteria = votesResult.criteria.length > 0 ? votesResult.criteria : criteriaForForm.criteria
  const canSchedule = isOwner && project.status === 'SKETCH'
  const canPublish = isOwner && (project.status === 'SKETCH' || project.status === 'SCHEDULED')
  const canInvite = isOwner && project.status !== 'ARCHIVED'
  const hasOwnerActions = canSchedule || canPublish || canInvite

  const authorName = authorData?.author.name ?? 'Autor'
  const coauthors = members
    .filter((member) => member.status === 'ACCEPTED')
    .map((member) => ({ id: member.userId, name: member.name }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 py-8">
        <ProjectCoverFrame
          coverUrl={coverUrl}
          alt={`Capa de ${project.title}`}
          tagLabel={projectTags[0]?.name}
          priority
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs tracking-wider text-muted-foreground uppercase">{statusLabels[project.status]}</p>
            <h1 className="font-heading text-3xl font-semibold">{project.title}</h1>
            <p className="text-xs text-muted-foreground">
              Publicado em {new Date(project.createdAt).toLocaleString('pt-BR')}
            </p>
            <ProjectAuthors author={{ id: project.authorId, name: authorName }} coauthors={coauthors} />
          </div>

          {isAuthenticated && project.status === 'PUBLISHED' && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ProjectStarButton
                  projectId={project.id}
                  projectSlug={project.slug}
                  starred={starred}
                  starsCount={rating.starsCount}
                  disabled={isOwner}
                  variant="detail"
                />
                <ProjectPromoteButton projectId={project.id} projectSlug={project.slug} disabled={isOwner} />
              </div>
              {rating.teacherAverage !== null && (
                <p className="text-sm text-muted-foreground">
                  Overall docente{' '}
                  <span className="font-semibold tabular-nums text-foreground">{rating.teacherAverage.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {!isAuthenticated && project.status === 'PUBLISHED' && (
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <p>
                Estrelas <span className="font-semibold tabular-nums text-foreground">{rating.starsCount}</span>
              </p>
              {rating.teacherAverage !== null && (
                <p>
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

            {canRate && user && criteriaForForm.criteria.length > 0 && (
              <ProjectTeacherRatingForm
                projectId={project.id}
                projectSlug={project.slug}
                criteria={criteriaForForm.criteria}
                initialRating={myTeacherRating}
                teacherName={user.name}
              />
            )}
          </div>
        )}

        {isOwner && (
          <div>
            <Button nativeButton={false} variant="outline" render={<Link href={`/projetos/${project.slug}/editar`} />}>
              Gerenciar / Editar
            </Button>
          </div>
        )}

        {hasOwnerActions && (
          <div className="grid gap-4 lg:grid-cols-3">
            {canSchedule && (
              <div className="border border-border p-4">
                <FormScheduleProject projectId={project.id} projectSlug={project.slug} />
              </div>
            )}

            {canPublish && (
              <div className="border border-border p-4">
                <FormPublishProject projectId={project.id} projectSlug={project.slug} />
              </div>
            )}

            {canInvite && (
              <div className="border border-border p-4">
                <FormInviteProjectMember projectId={project.id} projectSlug={project.slug} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
