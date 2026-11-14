import { FetchCallsUseCase } from '@/domain/call/application/use-cases/call/fetch-calls'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchCallsController } from '../../controllers/call/fetch-calls.controller'

export function makeFetchCallsController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const fetchCallsUseCase = new FetchCallsUseCase(callsRepository, callSkillsRepository, tagsRepository)

  return new FetchCallsController(fetchCallsUseCase, tagsRepository, projectsRepository)
}
