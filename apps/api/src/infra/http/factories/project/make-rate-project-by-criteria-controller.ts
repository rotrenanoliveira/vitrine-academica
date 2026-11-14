import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RateProjectByCriteriaUseCase } from '@/domain/project/application/use-cases/teacher-rating/rate-project-by-criteria'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleRatingCriteriaRepository } from '@/infra/database/repositories/drizzle-rating-criteria-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { RateProjectByCriteriaController } from '../../controllers/project/rate-project-by-criteria.controller'

export function makeRateProjectByCriteriaController() {
  const rateProjectByCriteriaUseCase = new RateProjectByCriteriaUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectTeacherRatingsRepository(db),
    new DrizzleRatingCriteriaRepository(db),
    new DrizzleUsersRepository(db),
    new DrizzleInstitutionMembersRepository(db),
    new RegisterLogUseCase(new DrizzleAuditLogsRepository(db)),
  )

  return new RateProjectByCriteriaController(rateProjectByCriteriaUseCase)
}
