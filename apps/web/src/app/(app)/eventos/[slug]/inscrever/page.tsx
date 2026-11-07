import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RegisterProjectForm } from '@/components/event/register-project-form'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCachedPublicEvent } from '@/server/http/routes/events/get-public-event'
import { getCachedMyProjects } from '@/server/http/routes/projects/get-my-projects'
import type { Event } from '@/utils/type'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Inscrever projeto',
}

export default async function EventRegisterPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()

  let event: Event
  try {
    ;({ event } = await getCachedPublicEvent(slug))
  } catch {
    notFound()
  }

  if (event.phase !== 'OPEN') {
    notFound()
  }

  const { projects } = await getCachedMyProjects({ userId: user.id, status: 'PUBLISHED' })

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/eventos" />}>Eventos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/eventos/${slug}`} />}>{event.name ?? event.slug}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Inscrever</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Inscrever projeto</h1>
          <p className="text-muted-foreground text-sm">
            Selecione um projeto próprio já publicado. A inscrição começa pendente.
          </p>
        </div>
        <RegisterProjectForm eventId={event.id} eventSlug={event.slug} projects={projects} />
      </div>
    </div>
  )
}
