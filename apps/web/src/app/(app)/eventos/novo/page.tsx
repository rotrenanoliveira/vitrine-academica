import type { Metadata } from 'next'
import Link from 'next/link'
import { CreateEventForm } from '@/components/event/create-event-form'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCachedInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'

export const metadata: Metadata = {
  title: 'Novo evento',
}

export default async function NewEventPage() {
  const user = await requireUser()
  const [{ members }, { institutions }] = await Promise.all([
    getCachedMyInstitutionMemberships(user.id),
    getCachedInstitutions(),
  ])

  const institutionsById = new Map(institutions.map((institution) => [institution.id, institution]))

  const manageable = members.filter((membership) =>
    canManageInstitution([membership], membership.institutionId, user.id),
  )

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/eventos" />}>Eventos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Novo ciclo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Abrir escolha de tema</h1>
          <p className="text-muted-foreground text-sm">
            Somente gerente ou secretaria de uma instituição podem criar o ciclo.
          </p>
        </div>

        {manageable.length === 0 ? (
          <p className="text-muted-foreground text-sm">Você não gerencia nenhuma instituição ativa.</p>
        ) : (
          <div className="space-y-8">
            {manageable.map((membership) => {
              const institution = institutionsById.get(membership.institutionId)

              return (
                <section key={membership.id} className="space-y-3">
                  <h2 className="font-medium">{institution?.name ?? `Instituição ${membership.institutionId}`}</h2>
                  <CreateEventForm institutionId={membership.institutionId} />
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
