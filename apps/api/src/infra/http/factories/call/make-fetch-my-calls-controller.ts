import { FetchMyCallsUseCase } from '@/domain/call/application/use-cases/call/fetch-my-calls'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { FetchMyCallsController } from '../../controllers/call/fetch-my-calls.controller'

export function makeFetchMyCallsController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const fetchMyCallsUseCase = new FetchMyCallsUseCase(callsRepository, callSkillsRepository)

  return new FetchMyCallsController(fetchMyCallsUseCase)
}
