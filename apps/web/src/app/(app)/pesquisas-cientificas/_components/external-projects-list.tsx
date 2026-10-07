import { getCachedSearchExternalProjects } from '@/server/http/routes/projects/search-external-projects'
import type { ExternalProjectsFilters } from '../search-params'
import { ExternalProjectsTable } from './external-projects-table'

export async function ExternalProjectsList({ filters }: { filters: ExternalProjectsFilters }) {
  const query = filters.query?.trim() ?? ''

  if (query.length < 3) {
    return <p className="text-sm text-muted-foreground">Digite ao menos 3 caracteres para buscar.</p>
  }

  const { projects } = await getCachedSearchExternalProjects(query)

  return <ExternalProjectsTable data={projects} />
}
