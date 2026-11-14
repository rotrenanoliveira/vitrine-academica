import { eq } from 'drizzle-orm'
import type {
  CallProjectCreationRepository,
  CreateProjectFromCallParams,
} from '@/domain/call/application/repositories/call-project-creation-repository'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleCallMapper } from '../drizzle/mappers/drizzle-call-mapper'
import { DrizzleProjectMapper } from '../drizzle/mappers/drizzle-project-mapper'
import { DrizzleProjectMemberMapper } from '../drizzle/mappers/drizzle-project-member-mapper'
import { DrizzleProjectTagMapper } from '../drizzle/mappers/drizzle-project-tag-mapper'
import { calls, projectMembers, projects, projectTags } from '../drizzle/schemas'

export class DrizzleCallProjectCreationRepository implements CallProjectCreationRepository {
  constructor(private readonly db: DrizzleClient) {}

  async createProjectFromCall({
    project,
    projectTags: newProjectTags,
    projectMembers: newProjectMembers,
    call,
  }: CreateProjectFromCallParams): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(projects).values(DrizzleProjectMapper.toPersistence(project))

      if (newProjectTags.length > 0) {
        await tx
          .insert(projectTags)
          .values(newProjectTags.map((projectTag) => DrizzleProjectTagMapper.toPersistence(projectTag)))
      }

      if (newProjectMembers.length > 0) {
        await tx
          .insert(projectMembers)
          .values(newProjectMembers.map((projectMember) => DrizzleProjectMemberMapper.toPersistence(projectMember)))
      }

      await tx.update(calls).set(DrizzleCallMapper.toPersistence(call)).where(eq(calls.id, call.id.toString()))
    })
  }
}
