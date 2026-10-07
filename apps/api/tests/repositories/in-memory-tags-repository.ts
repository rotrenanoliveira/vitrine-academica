import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { Tag } from '@/domain/tag/enterprise/entities/tag'

export class InMemoryTagsRepository implements TagsRepository {
  public items: Tag[] = []

  async findAll(): Promise<Tag[]> {
    return this.items
  }

  async findById(id: string): Promise<Tag | null> {
    return this.items.find((tag) => tag.id.toString() === id) ?? null
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return this.items.find((tag) => tag.slug.value === slug) ?? null
  }

  async create(tag: Tag): Promise<void> {
    this.items.push(tag)
  }

  async save(tag: Tag): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === tag.id.toString())
    if (index === -1) return
    this.items[index] = tag
  }
}
