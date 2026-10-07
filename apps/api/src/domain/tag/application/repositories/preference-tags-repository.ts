import type { PreferenceTag } from '../../enterprise/entities/preference-tag'

export interface PreferenceTagsRepository {
  findByUserId(userId: string): Promise<PreferenceTag[]>
  findByUserIdAndTagId(userId: string, tagId: string): Promise<PreferenceTag | null>

  create(preferenceTag: PreferenceTag): Promise<void>
  save(preferenceTag: PreferenceTag): Promise<void>
}
