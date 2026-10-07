import type { Metadata } from 'next'
import Link from 'next/link'
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
import { getProject } from '@/server/http/routes/projects/get-project'

export const metadata: Metadata = {
  title: 'Detalhe do projeto',
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
  const { project } = await getProject(id)

  const isOwner = user.id === project.authorId
  const canEdit = isOwner
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
              <BreadcrumbPage>Detalhe</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="space-y-2">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{statusLabels[project.status]}</p>
          <h1 className="font-heading text-3xl font-semibold">{project.title}</h1>
          <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
          <p className="text-xs text-muted-foreground">
            Criado em {new Date(project.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>

        {canEdit && (
          <div>
            <Button nativeButton={false} render={<Link href={`/projetos/${project.id}/editar`} />}>
              Editar
            </Button>
          </div>
        )}

        {canSchedule && (
          <div className="border border-border p-4">
            <FormScheduleProject projectId={project.id} />
          </div>
        )}
      </div>
    </div>
  )
}
