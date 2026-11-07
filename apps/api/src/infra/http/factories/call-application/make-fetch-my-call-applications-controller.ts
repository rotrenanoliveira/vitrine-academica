import { FetchMyCallApplicationsUseCase } from '@/domain/call/application/use-cases/call-application/fetch-my-call-applications'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { FetchMyCallApplicationsController } from '../../controllers/call-application/fetch-my-call-applications.controller'

export function makeFetchMyCallApplicationsController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const fetchMyCallApplicationsUseCase = new FetchMyCallApplicationsUseCase(callsRepository, callApplicationsRepository)

  return new FetchMyCallApplicationsController(fetchMyCallApplicationsUseCase)
}
