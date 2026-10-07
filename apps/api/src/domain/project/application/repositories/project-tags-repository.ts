import type { ProjectTag } from '../../enterprise/entities/project-tag'

export interface ProjectTagsRepository {
  findByProjectId(projectId: string): Promise<ProjectTag[]>
  findByTagId(tagId: string): Promise<ProjectTag[]>
  findByTagIds(tagIds: string[]): Promise<ProjectTag[]>
  findByProjectIdAndTagId(projectId: string, tagId: string): Promise<ProjectTag | null>

  create(projectTag: ProjectTag): Promise<void>
}
