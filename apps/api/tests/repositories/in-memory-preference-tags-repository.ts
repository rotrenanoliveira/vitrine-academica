import type { PreferenceTagsRepository } from '@/domain/tag/application/repositories/preference-tags-repository'
import type { PreferenceTag } from '@/domain/tag/enterprise/entities/preference-tag'

export class InMemoryPreferenceTagsRepository implements PreferenceTagsRepository {
  public items: PreferenceTag[] = []

  async findByUserId(userId: string): Promise<PreferenceTag[]> {
    return this.items.filter((preferenceTag) => preferenceTag.userId.toString() === userId)
  }

  async findByUserIdAndTagId(userId: string, tagId: string): Promise<PreferenceTag | null> {
    return (
      this.items.find(
        (preferenceTag) => preferenceTag.userId.toString() === userId && preferenceTag.tagId.toString() === tagId,
      ) ?? null
    )
  }

  async create(preferenceTag: PreferenceTag): Promise<void> {
    this.items.push(preferenceTag)
  }

  async save(preferenceTag: PreferenceTag): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === preferenceTag.id.toString())
    if (index === -1) return
    this.items[index] = preferenceTag
  }
}
