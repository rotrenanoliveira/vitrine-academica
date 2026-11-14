import type { Metadata } from 'next'
import { AppHeader } from '@/components/app-header'
import { HomeProjectsGallery } from './_components/home-projects-gallery'

export const metadata: Metadata = {
  title: 'Vitrine Acadêmica',
  description: 'Galeria virtual de projetos.',
}

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-dvw flex-col gap-8 py-8">
      <AppHeader />

      <main className="space-y-4">
        <HomeProjectsGallery />
      </main>
    </div>
  )
}
