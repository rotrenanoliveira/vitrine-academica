import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HomePreferencesBanner, HomeProjectsList } from '@/app/_components/home-projects-list'
import { AppNav } from '@/components/app-nav'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedUserPreferenceTags } from '@/server/http/routes/preference-tags/fetch-user-preference-tags'
import { getCachedProjectsOfInterest } from '@/server/http/routes/projects/fetch-projects-of-interest'
import { getCachedPublishedProjects } from '@/server/http/routes/projects/fetch-published-projects'
import { resolveProjectsWithCover } from '@/server/projects/resolve-project-cover-url'
import type { Project } from '@/utils/type'

export const metadata: Metadata = {
  title: 'Vitrine Acadêmica',
}

async function loadHomeProjects(userId?: string): Promise<{
  projects: Project[]
  showPreferencesBanner: boolean
  personalized: boolean
}> {
  if (!userId) {
    const { projects } = await getCachedPublishedProjects()
    return { projects, showPreferencesBanner: false, personalized: false }
  }

  const { preferenceTags } = await getCachedUserPreferenceTags(userId)
  const activePreferences = preferenceTags.filter((preference) => preference.status === 'ACTIVE')

  if (activePreferences.length === 0) {
    const { projects } = await getCachedPublishedProjects()
    return { projects, showPreferencesBanner: true, personalized: false }
  }

  const { projects } = await getCachedProjectsOfInterest(userId)
  const published = projects.filter((project) => project.status === 'PUBLISHED')

  return { projects: published, showPreferencesBanner: false, personalized: true }
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const { projects, showPreferencesBanner, personalized } = await loadHomeProjects(user?.id)
  const projectsWithCover = await resolveProjectsWithCover(projects)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Link href="/">
            <Image src="/vitrine-icon.png" alt="Vitrine Acadêmica" width={48} height={48} />
          </Link>
          <div className="space-y-1">
            <p className="font-heading text-2xl font-semibold">Vitrine Acadêmica</p>
            <p className="text-sm text-muted-foreground">
              {personalized ? 'Projetos com base nas suas tags preferidas.' : 'Projetos acadêmicos publicados.'}
            </p>
          </div>
        </div>

        <AppNav />
      </header>

      <main className="space-y-4">
        {showPreferencesBanner ? <HomePreferencesBanner /> : null}
        <HomeProjectsList projects={projectsWithCover} />
      </main>
    </div>
  )
}
