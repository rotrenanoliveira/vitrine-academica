import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallSkill, type CallSkillProps } from '@/domain/call/enterprise/entities/call-skill'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'

export function makeCallSkill(override: Partial<CallSkillProps> = {}, id?: UniqueEntityId) {
  const callSkill = CallSkill.create(
    {
      callId: new UniqueEntityId(),
      tagId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { callSkill }
}

export async function makeCallSkillOnDatabase(override: Partial<CallSkillProps> = {}, id?: UniqueEntityId) {
  const { callSkill } = makeCallSkill(override, id)

  const callSkillsRepository = new DrizzleCallSkillsRepository(db)

  await callSkillsRepository.createMany([callSkill])

  return { callSkill }
}
