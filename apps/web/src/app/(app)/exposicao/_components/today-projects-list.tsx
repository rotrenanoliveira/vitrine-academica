import { HomeProjectsList } from '@/app/_components/home-projects-list'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedPublishedProjectsToday } from '@/server/http/routes/projects/fetch-published-projects-today'
import { loadStarredProjectIds } from '@/server/projects/load-starred-project-ids'
import { resolveProjectsWithCover } from '@/server/projects/resolve-project-cover-url'

export async function TodayProjectsList() {
  const user = await getCurrentUser()
  const [{ projects }, starredProjectIds] = await Promise.all([
    getCachedPublishedProjectsToday(),
    loadStarredProjectIds(Boolean(user)),
  ])

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto lançado hoje.</p>
  }

  const projectsWithCover = await resolveProjectsWithCover(projects)

  return (
    <HomeProjectsList
      projects={projectsWithCover}
      starredProjectIds={starredProjectIds}
      currentUserId={user?.id}
      authenticated={Boolean(user)}
    />
  )
}
