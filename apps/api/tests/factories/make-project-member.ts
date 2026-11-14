import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectMember, type ProjectMemberProps } from '@/domain/project/enterprise/entities/project-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'

export function makeProjectMember(override: Partial<ProjectMemberProps> = {}, id?: UniqueEntityId) {
  const projectMember = ProjectMember.create(
    {
      projectId: new UniqueEntityId(),
      userId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { projectMember }
}

export async function makeProjectMemberOnDatabase(override: Partial<ProjectMemberProps> = {}, id?: UniqueEntityId) {
  const { projectMember } = makeProjectMember(override, id)

  const projectMembersRepository = new DrizzleProjectMembersRepository(db)

  await projectMembersRepository.create(projectMember)

  return { projectMember }
}
