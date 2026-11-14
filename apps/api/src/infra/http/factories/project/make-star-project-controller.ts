import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { GrantStarPointsUseCase } from '@/domain/points/application/use-cases/point-transaction/grant-star-points'
import { StarProjectUseCase } from '@/domain/project/application/use-cases/project-star/star-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectStarCreditsRepository } from '@/infra/database/repositories/drizzle-project-star-credits-repository'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { StarProjectController } from '../../controllers/project/star-project.controller'

export function makeStarProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectStarsRepository = new DrizzleProjectStarsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const projectStarCreditsRepository = new DrizzleProjectStarCreditsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const grantStarPointsUseCase = new GrantStarPointsUseCase(
    projectMembersRepository,
    projectStarCreditsRepository,
    registerLogUseCase,
  )

  const starProjectUseCase = new StarProjectUseCase(
    projectsRepository,
    projectStarsRepository,
    usersRepository,
    institutionMembersRepository,
    grantStarPointsUseCase,
    registerLogUseCase,
  )

  return new StarProjectController(starProjectUseCase)
}
