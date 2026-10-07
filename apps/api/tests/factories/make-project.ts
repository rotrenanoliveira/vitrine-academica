const { faker } = require('@faker-js/faker/locale/pt_BR')

import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Project, type ProjectProps } from '@/domain/project/enterprise/entities/project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'

export function makeProject(override: Partial<ProjectProps> = {}, id?: UniqueEntityId) {
  const project = Project.create(
    {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      author: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { project }
}

export async function makeProjectOnDatabase(override: Partial<ProjectProps> = {}, id?: UniqueEntityId) {
  const { project } = makeProject(override, id)

  const projectsRepository = new DrizzleProjectsRepository(db)

  await projectsRepository.create(project)

  return { project }
}
