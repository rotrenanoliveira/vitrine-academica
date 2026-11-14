import type {
  CurationFilters,
  CurationRepository,
} from '@/domain/curation/application/repositories/curation-repository'
import type { Project } from '@/domain/project/enterprise/entities/project'

export class InMemoryCurationRepository implements CurationRepository {
  public teacherProjects: Project[] = []
  public communityProjects: Project[] = []
  public lastTeacherFilters: CurationFilters | null = null
  public lastCommunityFilters: CurationFilters | null = null

  private applyFilters(projects: Project[], filters: CurationFilters) {
    let filtered = projects

    if (filters.title) {
      const title = filters.title.toLowerCase()
      filtered = filtered.filter((project) => project.title.toLowerCase().includes(title))
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
      filtered = filtered.filter((project) => project.tags.some((tagId) => filters.tagIds?.includes(tagId)))
    }

    filtered = [...filtered].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())

    if (filters.limit !== undefined) {
      return filtered.slice(0, filters.limit)
    }

    return filtered
  }

  async findTopByTeachers(filters: CurationFilters): Promise<Project[]> {
    this.lastTeacherFilters = filters

    return this.applyFilters(this.teacherProjects, filters)
  }

  async findTopByCommunity(filters: CurationFilters): Promise<Project[]> {
    this.lastCommunityFilters = filters

    return this.applyFilters(this.communityProjects, filters)
  }
}
