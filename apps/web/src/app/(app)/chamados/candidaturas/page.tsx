import type { Metadata } from 'next'
import Link from 'next/link'
import { MyApplicationsTable } from '@/components/call/my-applications-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getMyCallApplications } from '@/server/http/routes/calls/get-my-call-applications'

export const metadata: Metadata = {
  title: 'Minhas candidaturas',
}

export default async function MyCallApplicationsPage() {
  await requireUser()
  const { applications } = await getMyCallApplications()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/chamados" />}>Chamados</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Minhas candidaturas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <MyApplicationsTable data={applications} />
      </div>
    </div>
  )
}
