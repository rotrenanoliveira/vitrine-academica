import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Institution } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface EditInstitutionUseCaseRequest {
  institutionId: string
  actorId: string
  name: string
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

type UpdateInstitutionInput = {
  institution: Institution
  actorId: string
  name: string
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

type EditInstitutionUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { institution: Institution }
>

export class EditInstitutionUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute(params: EditInstitutionUseCaseRequest): Promise<EditInstitutionUseCaseResponse> {
    const institutionResult = await this.findInstitutionOrFail(params.institutionId, params.actorId)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const institution = institutionResult.value

    const manageResult = await this.canManageInstitution(params.institutionId, params.actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const { institution: updatedInstitution } = await this.updateInstitution({
      name: params.name,
      description: params.description,
      shouldProof: params.shouldProof ?? false,
      shouldVerify: params.shouldVerify ?? false,
      domain: params.domain,
      actorId: params.actorId,
      institution,
    })

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
      text,
      status,
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

  private async updateInstitution({ institution, actorId, ...input }: UpdateInstitutionInput) {
    const diff: Record<string, { old: unknown; new: unknown }> = {
      name: { old: institution.name, new: input.name },
      description: { old: institution.description, new: input.description },
    }

    institution.name = input.name
    institution.description = input.description

    if (input.shouldProof !== undefined) {
      diff.shouldProof = { old: institution.shouldProof, new: input.shouldProof }
      institution.shouldProof = input.shouldProof
    }

    if (input.shouldVerify !== undefined) {
      diff.shouldVerify = { old: institution.shouldVerify, new: input.shouldVerify }
      institution.shouldVerify = input.shouldVerify
    }

    if (input.domain !== undefined) {
      diff.domain = { old: institution.domain, new: input.domain }
      institution.domain = input.domain
    }

    await this.institutionsRepository.save(institution)

    await this.log({
      resourceId: institution.id.toString(),
      text: `Instituição ${institution.id.toString()} atualizada com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      actorId,
      diff,
    })

    return { institution }
  }
}
