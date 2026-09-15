import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PreferenceTag, type PreferenceTagProps } from '@/domain/tag/enterprise/entities/preference-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'

export function makePreferenceTag(override: Partial<PreferenceTagProps> = {}, id?: UniqueEntityId) {
  const preferenceTag = PreferenceTag.create(
    {
      userId: new UniqueEntityId(),
      tagId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { preferenceTag }
}

export async function makePreferenceTagOnDatabase(
  override: Partial<PreferenceTagProps> = {},
  id?: UniqueEntityId,
) {
  const { preferenceTag } = makePreferenceTag(override, id)

  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)

  await preferenceTagsRepository.create(preferenceTag)

  return { preferenceTag }
}
