import type { Metadata } from 'next'

import { Suspense } from 'react'

import { TodayProjectsList } from './_components/today-projects-list'

export const metadata: Metadata = {
  title: 'Projetos de hoje',
  description: 'Projetos acadêmicos lançados no dia atual',
}

export default function TodayProjectsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando projetos…</p>}>
      <TodayProjectsList />
    </Suspense>
  )
}
