import type { CallSkillsRepository } from '@/domain/call/application/repositories/call-skills-repository'
import type { CallSkill } from '@/domain/call/enterprise/entities/call-skill'

export class InMemoryCallSkillsRepository implements CallSkillsRepository {
  public items: CallSkill[] = []

  async findManyByCallId(callId: string): Promise<CallSkill[]> {
    return this.items.filter((skill) => skill.callId.toString() === callId)
  }

  async findManyByCallIds(callIds: string[]): Promise<CallSkill[]> {
    return this.items.filter((skill) => callIds.includes(skill.callId.toString()))
  }

  async findManyByTagId(tagId: string): Promise<CallSkill[]> {
    return this.items.filter((skill) => skill.tagId.toString() === tagId)
  }

  async findManyByTagIds(tagIds: string[]): Promise<CallSkill[]> {
    return this.items.filter((skill) => tagIds.includes(skill.tagId.toString()))
  }

  async createMany(skills: CallSkill[]): Promise<void> {
    this.items.push(...skills)
  }

  async deleteManyByCallId(callId: string): Promise<void> {
    this.items = this.items.filter((skill) => skill.callId.toString() !== callId)
  }
}
