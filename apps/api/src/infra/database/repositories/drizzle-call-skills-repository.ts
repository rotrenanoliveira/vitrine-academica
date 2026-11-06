import { eq, inArray } from 'drizzle-orm'
import type { CallSkillsRepository } from '@/domain/call/application/repositories/call-skills-repository'
import type { CallSkill } from '@/domain/call/enterprise/entities/call-skill'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleCallSkillMapper } from '../drizzle/mappers/drizzle-call-skill-mapper'
import { callSkills } from '../drizzle/schemas'

export class DrizzleCallSkillsRepository implements CallSkillsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findManyByCallId(callId: string): Promise<CallSkill[]> {
    const rows = await this.db.select().from(callSkills).where(eq(callSkills.callId, callId))

    return rows.map(DrizzleCallSkillMapper.toDomain)
  }

  async findManyByCallIds(callIds: string[]): Promise<CallSkill[]> {
    if (callIds.length === 0) {
      return []
    }

    const rows = await this.db.select().from(callSkills).where(inArray(callSkills.callId, callIds))

    return rows.map(DrizzleCallSkillMapper.toDomain)
  }

  async findManyByTagId(tagId: string): Promise<CallSkill[]> {
    const rows = await this.db.select().from(callSkills).where(eq(callSkills.tagId, tagId))

    return rows.map(DrizzleCallSkillMapper.toDomain)
  }

  async createMany(skills: CallSkill[]): Promise<void> {
    if (skills.length === 0) {
      return
    }

    await this.db.insert(callSkills).values(skills.map(DrizzleCallSkillMapper.toPersistence))
  }

  async deleteManyByCallId(callId: string): Promise<void> {
    await this.db.delete(callSkills).where(eq(callSkills.callId, callId))
  }
}
