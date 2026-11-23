import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMember, type InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import type { Institution } from '../../../enterprise/entities/institutions'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface CreateInstitutionMemberUseCaseRequest {
  institutionId: string
  actorId: string
  userId: string
  role: InstitutionMemberRole
}

type CreateInstitutionMemberUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError | InstitutionMemberAlreadyExistsError,
  { member: InstitutionMember }
>

export class CreateInstitutionMemberUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    institutionId,
    actorId,
    userId,
    role,
  }: CreateInstitutionMemberUseCaseRequest): Promise<CreateInstitutionMemberUseCaseResponse> {
    const institutionResult = await this.findInstitutionOrFail(institutionId, actorId)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const manageResult = await this.canManageInstitution(institutionId, actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const duplicateResult = await this.validateMemberRole(institutionId, userId, role, actorId)

    if (duplicateResult.isLeft()) {
      return left(duplicateResult.value)
    }

    const { member } = await this.createMember(institutionId, userId, role, actorId)

    return right({ member })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'institution.member',
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

  private async validateMemberRole(
    institutionId: string,
    userId: string,
    role: InstitutionMemberRole,
    actorId: string,
  ): Promise<Either<InstitutionMemberAlreadyExistsError, null>> {
    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(institutionId, userId)

    if (existingMember && existingMember.role === role) {
      await this.log({
        actorId,
        resourceId: existingMember.id.toString(),
        text: `Membro ${existingMember.id.toString()} já existe.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionMemberAlreadyExistsError())
    }

    return right(null)
  }

  private async createMember(institutionId: string, userId: string, role: InstitutionMemberRole, actorId: string) {
    const member = InstitutionMember.create({
      institutionId,
      userId,
      role,
    })

    await this.institutionMembersRepository.create(member)

    await this.log({
      actorId,
      resourceId: member.id.toString(),
      text: `Membro criado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: null,
    })

    return { member }
  }
}
