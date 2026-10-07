import { and, eq } from 'drizzle-orm'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionMember } from '@/domain/institution/enterprise/entities/institution-member'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleInstitutionMemberMapper } from '../drizzle/mappers/drizzle-institution-member-mapper'
import { institutionMembers } from '../drizzle/schemas'

export class DrizzleInstitutionMembersRepository implements InstitutionMembersRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<InstitutionMember | null> {
    const [row] = await this.db.select().from(institutionMembers).where(eq(institutionMembers.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMemberMapper.toDomain(row)
  }

  async findManyByInstitutionId(institutionId: string): Promise<InstitutionMember[]> {
    const rows = await this.db
      .select()
      .from(institutionMembers)
      .where(eq(institutionMembers.institutionId, institutionId))

    return rows.map(DrizzleInstitutionMemberMapper.toDomain)
  }

  async findManyByUserId(userId: string): Promise<InstitutionMember[]> {
    const rows = await this.db.select().from(institutionMembers).where(eq(institutionMembers.userId, userId))

    return rows.map(DrizzleInstitutionMemberMapper.toDomain)
  }

  async findByInstitutionAndUser(institutionId: string, userId: string): Promise<InstitutionMember | null> {
    const [row] = await this.db
      .select()
      .from(institutionMembers)
      .where(and(eq(institutionMembers.institutionId, institutionId), eq(institutionMembers.userId, userId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMemberMapper.toDomain(row)
  }

  async create(member: InstitutionMember): Promise<void> {
    await this.db.insert(institutionMembers).values(DrizzleInstitutionMemberMapper.toPersistence(member))
  }

  async save(member: InstitutionMember): Promise<void> {
    await this.db
      .update(institutionMembers)
      .set(DrizzleInstitutionMemberMapper.toPersistence(member))
      .where(eq(institutionMembers.id, member.id.toString()))
  }
}
