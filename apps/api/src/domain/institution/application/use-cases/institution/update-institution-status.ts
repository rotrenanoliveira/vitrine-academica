import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Institution, InstitutionStatus } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface UpdateInstitutionStatusUseCaseRequest {
  institutionId: string
  actorId: string
  status: InstitutionStatus
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type UpdateInstitutionStatusUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { institution: Institution }
>

export class UpdateInstitutionStatusUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'institution',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    institutionId,
    actorId,
    status,
  }: UpdateInstitutionStatusUseCaseRequest): Promise<UpdateInstitutionStatusUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      await this.log({
        actorId,
        resourceId: institutionId,
        text: `Instituição ${institutionId} não encontrada.`,
        status: AuditLogStatus.FAILURE,
      })
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      await this.log({
        actorId,
        resourceId: institutionId,
        text: `Usuário ${actorId} não tem permissão para gerenciar a instituição ${institutionId}.`,
        status: AuditLogStatus.FAILURE,
      })
      return left(new NotAllowedToManageInstitutionError())
    }

    const oldStatus = institution.status
    institution.status = status

    await this.institutionsRepository.save(institution)

    await this.log({
      actorId,
      resourceId: institutionId,
      status: AuditLogStatus.SUCCESS,
      text: `Instituição ${institutionId} atualizada com sucesso.`,
      diff: { status: { old: oldStatus, new: status } },
    })

    return right({ institution })
  }
}
