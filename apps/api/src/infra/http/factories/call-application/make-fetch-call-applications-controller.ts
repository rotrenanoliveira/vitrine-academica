import { FetchCallApplicationsUseCase } from '@/domain/call/application/use-cases/call-application/fetch-call-applications'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchCallApplicationsController } from '../../controllers/call-application/fetch-call-applications.controller'

export function makeFetchCallApplicationsController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const fetchCallApplicationsUseCase = new FetchCallApplicationsUseCase(
    callsRepository,
    callApplicationsRepository,
    usersRepository,
  )

  return new FetchCallApplicationsController(fetchCallApplicationsUseCase)
}
