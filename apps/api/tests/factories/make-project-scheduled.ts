import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectScheduled, type ProjectScheduledProps } from '@/domain/project/enterprise/entities/project-scheduled'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'

export function makeProjectScheduled(override: Partial<ProjectScheduledProps> = {}, id?: UniqueEntityId) {
  const projectScheduled = ProjectScheduled.create(
    {
      projectId: new UniqueEntityId(),
      publishedIn: new Date(),
      ...override,
    },
    id,
  )

  return { projectScheduled }
}

export async function makeProjectScheduledOnDatabase(
  override: Partial<ProjectScheduledProps> = {},
  id?: UniqueEntityId,
) {
  const { projectScheduled } = makeProjectScheduled(override, id)

  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)

  await projectScheduledRepository.create(projectScheduled)

  return { projectScheduled }
}
