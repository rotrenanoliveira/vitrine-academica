import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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

  async execute({
    institutionId,
    actorId,
    status,
  }: UpdateInstitutionStatusUseCaseRequest): Promise<UpdateInstitutionStatusUseCaseResponse> {
    const institutionResult = await this.findInstitutionOrFail(institutionId, actorId)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const institution = institutionResult.value

    const manageResult = await this.canManageInstitution(institutionId, actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const { institution: updatedInstitution } = await this.updateInstitutionStatus(institution, status, actorId)

    return right({
      institution: updatedInstitution,
    })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'institution',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findInstitutionOrFail(
    institutionId: string,
    actorId: string,
  ): Promise<Either<InstitutionNotFoundError, Institution>> {
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

    return right(institution)
  }

  private async canManageInstitution(
    institutionId: string,
    actorId: string,
  ): Promise<Either<NotAllowedToManageInstitutionError, true>> {
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

    return right(true)
  }

  private async updateInstitutionStatus(institution: Institution, status: InstitutionStatus, actorId: string) {
    const oldStatus = institution.status
    institution.status = status

    await this.institutionsRepository.save(institution)

    await this.log({
      resourceId: institution.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Instituição ${institution.id.toString()} atualizada com sucesso.`,
      diff: { status: { old: oldStatus, new: status } },
      actorId,
    })

    return { institution }
  }
}
