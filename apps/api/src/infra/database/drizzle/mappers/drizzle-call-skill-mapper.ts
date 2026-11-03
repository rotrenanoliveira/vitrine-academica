import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallSkill } from '@/domain/call/enterprise/entities/call-skill'
import type { callSkills } from '../schemas/call-skills'

type DrizzleCallSkill = typeof callSkills.$inferSelect
type DrizzleCallSkillInsert = typeof callSkills.$inferInsert

export class DrizzleCallSkillMapper {
  static toDomain(row: DrizzleCallSkill): CallSkill {
    return CallSkill.create(
      {
        callId: new UniqueEntityId(row.callId),
        tagId: new UniqueEntityId(row.tagId),
        description: row.description,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(skill: CallSkill): DrizzleCallSkillInsert {
    return {
      id: skill.id.toString(),
      callId: skill.callId.toString(),
      tagId: skill.tagId.toString(),
      description: skill.description,
    }
  }
}
