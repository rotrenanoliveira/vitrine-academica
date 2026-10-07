import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'

export class InMemoryProjectTagsRepository implements ProjectTagsRepository {
  public items: ProjectTag[] = []

  async findByProjectId(projectId: string): Promise<ProjectTag[]> {
    return this.items.filter((projectTag) => projectTag.projectId.toString() === projectId)
  }

  async findByTagId(tagId: string): Promise<ProjectTag[]> {
    return this.items.filter((projectTag) => projectTag.tagId.toString() === tagId)
  }

  async findByTagIds(tagIds: string[]): Promise<ProjectTag[]> {
    return this.items.filter((projectTag) => tagIds.includes(projectTag.tagId.toString()))
  }

  async findByProjectIdAndTagId(projectId: string, tagId: string): Promise<ProjectTag | null> {
    return (
      this.items.find(
        (projectTag) => projectTag.projectId.toString() === projectId && projectTag.tagId.toString() === tagId,
      ) ?? null
    )
  }

  async create(projectTag: ProjectTag): Promise<void> {
    this.items.push(projectTag)
  }
}
