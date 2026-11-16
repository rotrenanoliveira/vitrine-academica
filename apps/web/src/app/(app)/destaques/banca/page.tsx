import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DestaquesFilters } from '../_components/destaques-filters'
import { DestaquesHeader } from '../_components/destaques-header'
import { DestaquesProjectsGridSkeleton } from '../_components/destaques-projects-grid-skeleton'
import { DestaquesTypeList } from '../_components/destaques-type-list'

export const metadata: Metadata = {
  title: 'Destaques da banca',
  description: 'Projetos melhor avaliados pelos docentes',
}

export default function DestaquesBancaPage() {
  return (
    <div className="space-y-6">
      <DestaquesHeader />
      <Suspense fallback={null}>
        <DestaquesFilters />
      </Suspense>
      <Suspense fallback={<DestaquesProjectsGridSkeleton />}>
        <DestaquesTypeList type="board" />
      </Suspense>
    </div>
  )
}
