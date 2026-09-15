import type { PreferenceTag } from '@/domain/tag/enterprise/entities/preference-tag'

export class PreferenceTagPresenter {
  static toHTTP(preferenceTag: PreferenceTag) {
    return {
      id: preferenceTag.id.toString(),
      tagId: preferenceTag.tagId.toString(),
      userId: preferenceTag.userId.toString(),
      status: preferenceTag.status,
      createdAt: preferenceTag.createdAt.toISOString(),
    }
  }
}
