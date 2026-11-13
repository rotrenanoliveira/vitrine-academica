import type { Metadata } from 'next'
import Link from 'next/link'
import { CallsTable } from '@/components/call/calls-table'
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
import { getMyCalls } from '@/server/http/routes/calls/get-my-calls'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'

export const metadata: Metadata = {
  title: 'Meus chamados',
}

export default async function MyCallsPage() {
  await requireUser()
  const [{ calls }, { tags }] = await Promise.all([getMyCalls(), getCachedTags()])

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
              <BreadcrumbPage>Meus chamados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex justify-end">
          <Button nativeButton={false} render={<Link href="/chamados/novo" />}>
            Novo chamado
          </Button>
        </div>
        <CallsTable data={calls} tags={tags} showStatus />
      </div>
    </div>
  )
}
