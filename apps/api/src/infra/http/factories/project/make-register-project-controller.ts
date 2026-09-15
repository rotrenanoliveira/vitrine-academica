import { RegisterProjectUseCase } from '@/domain/project/application/use-cases/project/register-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { RegisterProjectController } from '../../controllers/project/register-project.controller'

export function makeRegisterProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const registerProjectUseCase = new RegisterProjectUseCase(projectsRepository)

  return new RegisterProjectController(registerProjectUseCase)
}
