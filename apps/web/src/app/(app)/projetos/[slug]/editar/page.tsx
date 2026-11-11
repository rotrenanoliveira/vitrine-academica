import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormRelateProjectTags } from '@/components/project/form-relate-project-tags'
import { FormScheduleProject } from '@/components/project/form-schedule-project'
import { FormUpdateProject } from '@/components/project/form-update-project'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getProjectBySlug } from '@/server/http/routes/projects/get-project-by-slug'
import { listProjectMembers } from '@/server/http/routes/projects/list-project-members'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'

export const metadata: Metadata = {
  title: 'Editar projeto',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()
  const { project } = await getProjectBySlug(slug)
  const [{ tags }, { members }] = await Promise.all([
    getCachedTags(),
    listProjectMembers({ projectId: project.id }),
  ])

  const isOwner = user.id === project.authorId
  const isCoauthor = members.some((member) => member.userId === user.id)

  if (!isOwner && !isCoauthor) {
    notFound()
  }

  const canSchedule = isOwner && project.status === 'SKETCH'

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
              <BreadcrumbLink render={<Link href={`/projetos/${project.slug}`} />}>Vitrine</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="border border-border p-6">
            <FormUpdateProject project={project} canChangeStatus={isOwner} />
          </div>
          {isOwner && (
            <div className="border border-border p-6">
              <FormRelateProjectTags project={project} tags={tags} />
            </div>
          )}
          {canSchedule && (
            <div className="border border-border p-6">
              <FormScheduleProject projectId={project.id} projectSlug={project.slug} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
