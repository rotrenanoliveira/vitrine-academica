import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectsFilters } from './_components/projects-filters'
import { ProjectsGalleryList } from './_components/projects-gallery-list'

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Catálogo de projetos acadêmicos publicados',
}

export default function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ProjectsFilters />
        <Button nativeButton={false} render={<Link href="/projetos/novo" />}>
          Novo projeto
        </Button>
      </div>

      <ProjectsGalleryList />
    </div>
  )
}
