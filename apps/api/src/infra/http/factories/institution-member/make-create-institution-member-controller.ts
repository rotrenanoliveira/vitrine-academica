import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { CreateInstitutionMemberUseCase } from '@/domain/institution/application/use-cases/institution-member/create-institution-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { CreateInstitutionMemberController } from '../../controllers/institution-member/create-institution-member.controller'

export function makeCreateInstitutionMemberController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const createInstitutionMemberUseCase = new CreateInstitutionMemberUseCase(
    institutionsRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new CreateInstitutionMemberController(createInstitutionMemberUseCase)
}
