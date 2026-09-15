import { HomeProjectsList } from '@/app/_components/home-projects-list'
import { getCachedPublishedProjectsToday } from '@/server/http/routes/projects/fetch-published-projects-today'
import { resolveProjectsWithCover } from '@/server/projects/resolve-project-cover-url'

export async function TodayProjectsList() {
  const { projects } = await getCachedPublishedProjectsToday()

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto lançado hoje.</p>
  }

  const projectsWithCover = await resolveProjectsWithCover(projects)

  return <HomeProjectsList projects={projectsWithCover} />
}
