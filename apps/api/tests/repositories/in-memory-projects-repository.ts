import type {
  FindManyProjectsFilters,
  ProjectsRepository,
} from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'

export class InMemoryProjectsRepository implements ProjectsRepository {
  public items: Project[] = []

  async findAll(): Promise<Project[]> {
    return this.items
  }

  async findMany(filters: FindManyProjectsFilters = {}): Promise<Project[]> {
    const title = filters.title?.toLowerCase()

    return this.items
      .filter((project) => {
        if (filters.ids && !filters.ids.includes(project.id.toString())) return false
        if (filters.status && project.status !== filters.status) return false
        if (title && !project.title.toLowerCase().includes(title)) return false
        return true
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findById(id: string): Promise<Project | null> {
    return this.items.find((project) => project.id.toString() === id) ?? null
  }

  async findBySlug(slug: string): Promise<Project | null> {
    return this.items.find((project) => project.slug === slug) ?? null
  }

  async findManyByIds(ids: string[]): Promise<Project[]> {
    return this.items.filter((project) => ids.includes(project.id.toString()))
  }

  async findManyByAuthorId(authorId: string, status?: string): Promise<Project[]> {
    return this.items
      .filter((project) => {
        if (project.author.toString() !== authorId) return false
        if (status && project.status !== status) return false
        return true
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async create(project: Project): Promise<void> {
    this.items.push(project)
  }

  async save(project: Project): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === project.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = project
  }

  async delete(project: Project): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== project.id.toString())
  }
}
