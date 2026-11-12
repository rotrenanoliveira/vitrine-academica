import { getCachedSearchExternalProjects } from '@/server/http/routes/projects/search-external-projects'
import type { ExternalProjectsFilters } from '../search-params'
import { ExternalProjectsGallery } from './external-projects-gallery'
import { ExternalProjectsPagination } from './external-projects-pagination'

export async function ExternalProjectsList({ filters }: { filters: ExternalProjectsFilters }) {
  const query = filters.query?.trim() ?? ''
  const page = filters.page > 0 ? filters.page : 1

  if (query.length < 3) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Digite ao menos 3 caracteres para buscar.
      </p>
    )
  }

  try {
    const { projects, page: currentPage, hasNextPage } = await getCachedSearchExternalProjects(
      query,
      page,
    )

    return (
      <div className="flex flex-col gap-8">
        <ExternalProjectsGallery projects={projects} />
        <ExternalProjectsPagination page={currentPage} hasNextPage={hasNextPage} />
      </div>
    )
  } catch {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Não foi possível carregar as pesquisas. Tente novamente em instantes.
      </p>
    )
  }
}
