import type { Metadata } from 'next'

import { Suspense } from 'react'

import { ScheduledProjectsList } from '../_components/scheduled-projects-list'

export const metadata: Metadata = {
  title: 'Projetos em breve',
  description: 'Projetos acadêmicos agendados para os próximos 7 dias',
}

export const dynamic = 'force-dynamic'

export default async function ScheduledProjectsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando lançamentos…</p>}>
      <ScheduledProjectsList />
    </Suspense>
  )
}
