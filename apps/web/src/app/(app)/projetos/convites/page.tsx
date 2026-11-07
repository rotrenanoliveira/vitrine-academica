import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { ProjectInvitationsList } from './_components/project-invitations-list'

export const metadata: Metadata = {
  title: 'Convites',
  description: 'Convites para participar de projetos como coautor',
}

export const dynamic = 'force-dynamic'

export default async function ProjectInvitationsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Convites</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando convites…</p>}>
          <ProjectInvitationsList />
        </Suspense>
      </div>
    </div>
  )
}
