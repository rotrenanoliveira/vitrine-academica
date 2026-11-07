import { GetCallByIdUseCase } from '@/domain/call/application/use-cases/call/get-call-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { GetCallByIdController } from '../../controllers/call/get-call-by-id.controller'

export function makeGetCallByIdController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const getCallByIdUseCase = new GetCallByIdUseCase(callsRepository, callSkillsRepository)

  return new GetCallByIdController(getCallByIdUseCase)
}
