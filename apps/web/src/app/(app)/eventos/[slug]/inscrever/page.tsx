import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RegisterProjectForm } from '@/components/event/register-project-form'
import { NavBackPage } from '@/components/nav-back-page'
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
      <div className="flex flex-1 flex-col gap-12 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <NavBackPage label="Voltar para o evento" />
          <div>
            <h1 className="text-2xl font-semibold">Inscrever projeto</h1>
            <p className="text-muted-foreground text-sm">
              Selecione um projeto próprio já publicado. A inscrição começa pendente.
            </p>
          </div>
        </div>
        <RegisterProjectForm eventId={event.id} eventSlug={event.slug} projects={projects} />
      </div>
    </div>
  )
}
