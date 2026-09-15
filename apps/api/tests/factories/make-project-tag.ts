import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectTag, type ProjectTagProps } from '@/domain/project/enterprise/entities/project-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'

export function makeProjectTag(override: Partial<ProjectTagProps> = {}, id?: UniqueEntityId) {
  const projectTag = ProjectTag.create(
    {
      projectId: new UniqueEntityId(),
      tagId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { projectTag }
}

export async function makeProjectTagOnDatabase(
  override: Partial<ProjectTagProps> = {},
  id?: UniqueEntityId,
) {
  const { projectTag } = makeProjectTag(override, id)

  const projectTagsRepository = new DrizzleProjectTagsRepository(db)

  await projectTagsRepository.create(projectTag)

  return { projectTag }
}
