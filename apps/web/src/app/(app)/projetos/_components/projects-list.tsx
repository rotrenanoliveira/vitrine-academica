import { getCachedMyProjects } from '@/server/http/routes/projects/get-my-projects'
import { resolveProjectsWithCover } from '@/server/projects/resolve-project-cover-url'
import type { ProjectsFilters } from '../search-params'
import { ProjectsTable } from './projects-table'

export async function ProjectsList({ filters, userId }: { filters: ProjectsFilters; userId: string }) {
  const { projects } = await getCachedMyProjects({
    userId,
    status: filters.status ?? undefined,
  })

  const data = await resolveProjectsWithCover(projects)

  return <ProjectsTable data={data} />
}
