import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { HomeProjectsGallery } from './_components/home-projects-gallery'

export const metadata: Metadata = {
  title: 'Vitrine Acadêmica',
  description: 'Galeria virtual de projetos.',
}

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-dvw flex-col gap-8 py-8">
      <header className="flex items-start justify-between gap-4 px-5 sm:px-8 lg:px-16">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image src="/vitrine-icon.png" alt="Vitrine Acadêmica" width={48} height={48} />
          <p className="font-heading text-2xl font-semibold">Vitrine Acadêmica</p>
        </Link>

        <AppNav />
      </header>

      <main className="space-y-4">
        <HomeProjectsGallery />
      </main>
    </div>
  )
}
