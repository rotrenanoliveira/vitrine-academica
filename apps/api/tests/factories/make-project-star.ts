import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStar, type ProjectStarProps } from '@/domain/project/enterprise/entities/project-star'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'

export function makeProjectStar(override: Partial<ProjectStarProps> = {}, id?: UniqueEntityId) {
  const projectStar = ProjectStar.create(
    {
      projectId: new UniqueEntityId(),
      userId: new UniqueEntityId(),
      weight: 1,
      ...override,
    },
    id,
  )

  return { projectStar }
}

export async function makeProjectStarOnDatabase(override: Partial<ProjectStarProps> = {}, id?: UniqueEntityId) {
  const { projectStar } = makeProjectStar(override, id)

  const projectStarsRepository = new DrizzleProjectStarsRepository(db)

  await projectStarsRepository.create(projectStar)

  return { projectStar }
}
