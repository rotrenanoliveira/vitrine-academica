import type { Metadata } from 'next'
import Link from 'next/link'
import { EventCard } from '@/components/event/event-card'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedPublicEvents } from '@/server/http/routes/events/fetch-public-events'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Ciclos temáticos da vitrine acadêmica',
}

export default async function EventsPage() {
  const [{ events }, user] = await Promise.all([getCachedPublicEvents(), getCurrentUser()])
  const memberships = user ? (await getCachedMyInstitutionMemberships(user.id)).members : []

  const preparing = events.filter(
    (event) => event.phase === 'THEME_SELECTION' || event.phase === 'INSTITUTIONAL_SELECTION',
  )
  const open = events.filter((event) => event.phase === 'OPEN')
  const closed = events.filter((event) => event.phase === 'CLOSED')

  function canManageEvent(institutionId: string) {
    if (!user) return false
    return canManageInstitution(memberships, institutionId, user.id)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Eventos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Eventos</h1>
            <p className="text-muted-foreground text-sm">
              Ciclos globais em preparação, edições abertas e encerradas. Ciclos restritos à instituição aparecem na
              página dela.
            </p>
          </div>
          {user && (
            <Button nativeButton={false} render={<Link href="/eventos/novo" />}>
              Novo ciclo
            </Button>
          )}
        </div>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Em preparação</h2>
          {preparing.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum ciclo em escolha ou seleção de tema.</p>
          ) : (
            preparing.map((event) => (
              <EventCard key={event.id} event={event} canManage={canManageEvent(event.institutionId)} />
            ))
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Em andamento</h2>
          {open.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento aberto no momento.</p>
          ) : (
            open.map((event) => (
              <EventCard key={event.id} event={event} canManage={canManageEvent(event.institutionId)} />
            ))
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Encerrados</h2>
          {closed.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento encerrado ainda.</p>
          ) : (
            closed.map((event) => (
              <EventCard key={event.id} event={event} canManage={canManageEvent(event.institutionId)} />
            ))
          )}
        </section>
      </div>
    </div>
  )
}
