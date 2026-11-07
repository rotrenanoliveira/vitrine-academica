import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SuggestThemeForm } from '@/components/event/suggest-theme-form'
import { VoteThemeList } from '@/components/event/vote-theme-list'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/server/auth/require-user'
import { getCachedThemeSelection } from '@/server/http/routes/events/get-theme-selection'
import type { Event, EventTheme } from '@/utils/type'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Escolha de tema',
}

export default async function EventThemeSelectionPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()

  // Aceita slug ou id no segmento (API resolve por id com fallback para slug).
  let payload: { event: Event; themes: EventTheme[] }
  try {
    payload = await getCachedThemeSelection(slug, user.id)
  } catch {
    notFound()
  }

  const { event, themes } = payload
  const votingOpen = event.phase === 'THEME_SELECTION'

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/eventos" />}>Eventos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Escolha de tema</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{event.name ?? event.slug}</h1>
          <p className="text-muted-foreground text-sm">
            {votingOpen
              ? 'Sugira temas e vote enquanto a primeira semana estiver aberta.'
              : event.phase === 'INSTITUTIONAL_SELECTION'
                ? 'A votação encerrou. A instituição ainda precisa escolher o tema.'
                : 'A escolha de tema deste ciclo já foi concluída.'}
          </p>
        </div>

        <Separator />

        {votingOpen && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Sugerir tema</h2>
            <SuggestThemeForm eventId={event.id} eventSlug={event.slug} />
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Temas</h2>
          {themes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum tema sugerido ainda.</p>
          ) : (
            <ul className="space-y-2">
              {themes.map((theme) => (
                <li key={theme.id} className="border-b border-border py-2 text-sm">
                  <span className="font-medium">{theme.title}</span>
                  <span className="text-muted-foreground"> — {theme.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {votingOpen && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Votar</h2>
            <VoteThemeList eventId={event.id} eventSlug={event.slug} themes={themes} />
          </section>
        )}
      </div>
    </div>
  )
}
