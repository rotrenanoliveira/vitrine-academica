import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventDeadline } from '@/components/event/event-deadline'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedApprovedParticipants } from '@/server/http/routes/events/fetch-approved-participants'
import { getCachedApprovedThemes } from '@/server/http/routes/events/fetch-approved-themes'
import { getCachedPublicEvent } from '@/server/http/routes/events/get-public-event'
import type { Event } from '@/utils/type'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const { event } = await getCachedPublicEvent(slug)
    return { title: event.name ?? event.slug }
  } catch {
    return { title: 'Evento' }
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  let event: Event
  try {
    ;({ event } = await getCachedPublicEvent(slug))
  } catch {
    notFound()
  }

  const [{ projects }, { themes }] = await Promise.all([
    getCachedApprovedParticipants(event.id),
    getCachedApprovedThemes(event.id),
  ])

  const winnerTheme = themes.find((theme) => theme.id === event.winnerThemeId) ?? themes[0]

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/eventos" />}>Eventos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>{event.name ?? event.slug}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{event.name ?? event.slug}</h1>
            <p className="text-muted-foreground text-sm">Fase: {event.phase}</p>
            <EventDeadline label="Início" date={event.startsAt} />
            <EventDeadline label="Encerramento" date={event.endsAt} />
          </div>
          <div className="flex flex-wrap gap-2">
            {user && event.phase === 'OPEN' && (
              <Button nativeButton={false} render={<Link href={`/eventos/${slug}/inscrever`} />}>
                Inscrever projeto
              </Button>
            )}
            <Button variant="outline" nativeButton={false} render={<Link href={`/projetos?eventSlug=${event.slug}`} />}>
              Ver projetos filtrados
            </Button>
          </div>
        </div>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Tema</h2>
          {winnerTheme ? (
            <div>
              <p className="font-medium">{winnerTheme.title}</p>
              <p className="text-muted-foreground text-sm">{winnerTheme.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Tema ainda não disponível.</p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Projetos participantes</h2>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum projeto aprovado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id} className="border-b border-border py-3">
                  <Link href={`/projetos/${project.id}`} className="font-medium hover:underline">
                    {project.title}
                  </Link>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
