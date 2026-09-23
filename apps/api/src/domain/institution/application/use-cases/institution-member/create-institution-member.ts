import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMember, type InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
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

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'institution.member',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    institutionId,
    actorId,
    userId,
    role,
  }: CreateInstitutionMemberUseCaseRequest): Promise<CreateInstitutionMemberUseCaseResponse> {
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

    return right({ member })
  }
}
