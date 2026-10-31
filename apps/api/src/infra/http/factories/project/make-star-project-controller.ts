import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { StarProjectUseCase } from '@/domain/project/application/use-cases/project-star/star-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { StarProjectController } from '../../controllers/project/star-project.controller'

export function makeStarProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectStarsRepository = new DrizzleProjectStarsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const starProjectUseCase = new StarProjectUseCase(
    projectsRepository,
    projectStarsRepository,
    usersRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new StarProjectController(starProjectUseCase)
}
