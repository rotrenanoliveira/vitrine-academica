import type { Project } from '../../enterprise/entities/project'

export interface ProjectsRepository {
  findAll(): Promise<Project[]>
  findById(id: string): Promise<Project | null>
  findManyByIds(ids: string[]): Promise<Project[]>
  findManyByAuthorId(authorId: string, status?: string): Promise<Project[]>

  create(project: Project): Promise<void>
  save(project: Project): Promise<void>
  delete(project: Project): Promise<void>
}
