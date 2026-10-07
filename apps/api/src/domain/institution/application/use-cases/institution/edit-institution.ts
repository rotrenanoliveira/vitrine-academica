import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'institution',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  async execute({
    institutionId,
    actorId,
    name,
    description,
    shouldProof,
    shouldVerify,
    domain,
  }: EditInstitutionUseCaseRequest): Promise<EditInstitutionUseCaseResponse> {
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

    const diff: Record<string, { old: unknown; new: unknown }> = {
      name: { old: institution.name, new: name },
      description: { old: institution.description, new: description },
    }

    institution.name = name
    institution.description = description

    if (shouldProof !== undefined) {
      diff.shouldProof = { old: institution.shouldProof, new: shouldProof }
      institution.shouldProof = shouldProof
    }

    if (shouldVerify !== undefined) {
      diff.shouldVerify = { old: institution.shouldVerify, new: shouldVerify }
      institution.shouldVerify = shouldVerify
    }

    if (domain !== undefined) {
      diff.domain = { old: institution.domain, new: domain }
      institution.domain = domain
    }

    await this.institutionsRepository.save(institution)

    await this.log({
      actorId,
      resourceId: institutionId,
      text: `Instituição ${institutionId} atualizada com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff,
    })

    return right({ institution })
  }
}
