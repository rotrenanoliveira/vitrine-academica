import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import {
  type InstitutionMember,
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '../../../enterprise/entities/institution-member'
import { CannotRemoveLastInstitutionManagerError } from '../../_errors/cannot-remove-last-institution-manager-error'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'

interface UpdateInstitutionMemberRoleUseCaseRequest {
  memberId: string
  actorId: string
  role: InstitutionMemberRole
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type UpdateInstitutionMemberRoleUseCaseResponse = Either<
  InstitutionMemberNotFoundError | NotAllowedToManageInstitutionError | CannotRemoveLastInstitutionManagerError,
  { member: InstitutionMember }
>

export class UpdateInstitutionMemberRoleUseCase {
  constructor(
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'institution.member',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  async execute({
    memberId,
    actorId,
    role,
  }: UpdateInstitutionMemberRoleUseCaseRequest): Promise<UpdateInstitutionMemberRoleUseCaseResponse> {
    const member = await this.institutionMembersRepository.findById(memberId)

    if (!member) {
      await this.log({
        actorId,
        resourceId: memberId,
        text: `Membro ${memberId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })
      return left(new InstitutionMemberNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(
      this.institutionMembersRepository,
      member.institutionId,
      actorId,
    )

    if (!isAllowedToManage) {
      await this.log({
        actorId,
        resourceId: memberId,
        text: `Usuário ${actorId} não tem permissão para gerenciar a instituição ${memberId}.`,
        status: AuditLogStatus.FAILURE,
      })
      return left(new NotAllowedToManageInstitutionError())
    }

    const isDemotingAManager = member.role === InstitutionMemberRole.MANAGER && role !== InstitutionMemberRole.MANAGER

    if (isDemotingAManager) {
      const members = await this.institutionMembersRepository.findManyByInstitutionId(member.institutionId)

      const otherActiveManagers = members.filter((otherMember) => {
        return (
          otherMember.id.toString() !== member.id.toString() &&
          otherMember.role === InstitutionMemberRole.MANAGER &&
          otherMember.status === InstitutionMemberStatus.ACTIVE
        )
      })

      if (otherActiveManagers.length === 0) {
        await this.log({
          actorId,
          resourceId: memberId,
          text: `Tentativa de remover o único gerente da instituição pelo membro ${memberId}.`,
          status: AuditLogStatus.FAILURE,
        })
        return left(new CannotRemoveLastInstitutionManagerError())
      }
    }

    const oldRole = member.role
    member.role = role

    await this.institutionMembersRepository.save(member)

    await this.log({
      actorId,
      resourceId: memberId,
      text: `Cargo do membro ${memberId} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { role: { old: oldRole, new: role } },
    })

    return right({ member })
  }
}
