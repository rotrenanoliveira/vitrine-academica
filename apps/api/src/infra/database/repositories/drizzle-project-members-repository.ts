import { and, asc, desc, eq } from 'drizzle-orm'
import type { ProjectMembersRepository } from '@/domain/project/application/repositories/project-members-repository'
import type { ProjectMember, ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectMemberMapper } from '../drizzle/mappers/drizzle-project-member-mapper'
import { projectMembers } from '../drizzle/schemas'

export class DrizzleProjectMembersRepository implements ProjectMembersRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<ProjectMember | null> {
    const [row] = await this.db.select().from(projectMembers).where(eq(projectMembers.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectMemberMapper.toDomain(row)
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null> {
    const [row] = await this.db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectMemberMapper.toDomain(row)
  }

  async findManyByProjectId(projectId: string): Promise<ProjectMember[]> {
    const rows = await this.db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(projectMembers.createdAt))

    return rows.map(DrizzleProjectMemberMapper.toDomain)
  }

  async findManyByUserId(userId: string, status?: ProjectMemberStatus): Promise<ProjectMember[]> {
    const filter = status
      ? and(eq(projectMembers.userId, userId), eq(projectMembers.status, status))
      : eq(projectMembers.userId, userId)

    const rows = await this.db.select().from(projectMembers).where(filter).orderBy(desc(projectMembers.createdAt))

    return rows.map(DrizzleProjectMemberMapper.toDomain)
  }

  async create(entity: ProjectMember): Promise<void> {
    await this.db.insert(projectMembers).values(DrizzleProjectMemberMapper.toPersistence(entity))
  }

  async save(entity: ProjectMember): Promise<void> {
    await this.db
      .update(projectMembers)
      .set(DrizzleProjectMemberMapper.toPersistence(entity))
      .where(eq(projectMembers.id, entity.id.toString()))
  }

  async delete(entity: ProjectMember): Promise<void> {
    await this.db.delete(projectMembers).where(eq(projectMembers.id, entity.id.toString()))
  }
}
