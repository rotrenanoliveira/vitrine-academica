import type { Project } from '../../enterprise/entities/project'

export interface FindManyProjectsFilters {
  status?: string
  title?: string
  ids?: string[]
  authorIds?: string[]
  page?: number
  limit?: number
}

export interface ProjectsRepository {
  findAll(): Promise<Project[]>
  findById(id: string): Promise<Project | null>
  findBySlug(slug: string): Promise<Project | null>
  findMany(filters?: FindManyProjectsFilters): Promise<Project[]>
  countMany(filters?: FindManyProjectsFilters): Promise<number>
  findManyByIds(ids: string[]): Promise<Project[]>
  findManyByAuthorId(authorId: string, status?: string): Promise<Project[]>

  create(project: Project): Promise<void>
  save(project: Project): Promise<void>
  delete(project: Project): Promise<void>
}
