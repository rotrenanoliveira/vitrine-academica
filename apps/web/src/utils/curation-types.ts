import type { ProjectListItem } from '@/utils/type'

export type CurationScope = 'board' | 'community' | 'all'

export interface Curation {
  total: number
  projects: ProjectListItem[]
}
