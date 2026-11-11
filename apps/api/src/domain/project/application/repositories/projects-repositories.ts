import type { Project } from '../../enterprise/entities/project'

export interface FindManyProjectsFilters {
  status?: string
  title?: string
  ids?: string[]
}

export interface ProjectsRepository {
  findAll(): Promise<Project[]>
  findById(id: string): Promise<Project | null>
  findBySlug(slug: string): Promise<Project | null>
  findMany(filters?: FindManyProjectsFilters): Promise<Project[]>
  findManyByIds(ids: string[]): Promise<Project[]>
  findManyByAuthorId(authorId: string, status?: string): Promise<Project[]>

  create(project: Project): Promise<void>
  save(project: Project): Promise<void>
  delete(project: Project): Promise<void>
}
