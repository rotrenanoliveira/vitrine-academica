import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CallsFilters } from './_components/calls-filters'
import { CallsGalleryList } from './_components/calls-gallery-list'

export const metadata: Metadata = {
  title: 'Chamados',
  description: 'Chamados para buscar colaboradores',
}

export default function CallsPage() {
  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <CallsFilters />
        <Button nativeButton={false} render={<Link href="/chamados/novo" />}>
          Novo chamado
        </Button>
      </div>

      <CallsGalleryList />
    </div>
  )
}
