import type { CallSkill } from '../../enterprise/entities/call-skill'

export interface CallSkillsRepository {
  findManyByCallId(callId: string): Promise<CallSkill[]>
  findManyByCallIds(callIds: string[]): Promise<CallSkill[]>
  findManyByTagId(tagId: string): Promise<CallSkill[]>

  createMany(skills: CallSkill[]): Promise<void>
  deleteManyByCallId(callId: string): Promise<void>
}
