import { createLoader, parseAsStringEnum, type SearchParams, type UrlKeys } from 'nuqs/server'
import type { ProjectStatus } from '@/utils/type'

const statusValues = ['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const satisfies readonly ProjectStatus[]

export const projectsSearchParams = {
  status: parseAsStringEnum([...statusValues]),
}

export const projectsUrlKeys: UrlKeys<typeof projectsSearchParams> = {
  status: 'status',
}

export const loadProjectsFilters = createLoader(projectsSearchParams, { urlKeys: projectsUrlKeys })

export type ProjectsFilters = Awaited<ReturnType<typeof loadProjectsFilters>>
export type { SearchParams }
