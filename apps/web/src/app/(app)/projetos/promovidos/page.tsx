import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PromotedProjectsGalleryList } from './_components/promoted-projects-gallery-list'

export const metadata: Metadata = {
  title: 'Projetos promovidos',
  description: 'Projetos em destaque promovidos pela comunidade',
}

export default function PromotedProjectsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      <div className="bg-[#f4f1eb] px-5 py-8 text-[#252422] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={<p className="text-sm text-[#252422]/70">Carregando projetos…</p>}>
            <PromotedProjectsGalleryList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
