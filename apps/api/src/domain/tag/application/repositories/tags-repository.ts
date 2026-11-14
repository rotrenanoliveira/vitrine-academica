import type { Tag } from '../../enterprise/entities/tag'

export interface TagsRepository {
  findAll(): Promise<Tag[]>
  findById(id: string): Promise<Tag | null>
  findBySlug(slug: string): Promise<Tag | null>
  findManyByIds(ids: string[]): Promise<Tag[]>

  create(tag: Tag): Promise<void>
  save(tag: Tag): Promise<void>
}
