import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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

type UpdateInstitutionMemberRoleUseCaseResponse = Either<
  InstitutionMemberNotFoundError | NotAllowedToManageInstitutionError | CannotRemoveLastInstitutionManagerError,
  { member: InstitutionMember }
>

export class UpdateInstitutionMemberRoleUseCase {
  constructor(
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    memberId,
    actorId,
    role,
  }: UpdateInstitutionMemberRoleUseCaseRequest): Promise<UpdateInstitutionMemberRoleUseCaseResponse> {
    const memberResult = await this.findMemberOrFail(memberId, actorId)

    if (memberResult.isLeft()) {
      return left(memberResult.value)
    }

    const member = memberResult.value

    const manageResult = await this.canManageInstitution(member, actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const lastManagerResult = await this.validateInstitutionManagerRemoval(member, role, actorId)

    if (lastManagerResult.isLeft()) {
      return left(lastManagerResult.value)
    }

    const { member: updatedMember } = await this.updateMemberRole(member, role, actorId)

    return right({
      member: updatedMember,
    })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'institution.member',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  private async findMemberOrFail(
    memberId: string,
    actorId: string,
  ): Promise<Either<InstitutionMemberNotFoundError, InstitutionMember>> {
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

    return right(member)
  }

  private async canManageInstitution(
    member: InstitutionMember,
    actorId: string,
  ): Promise<Either<NotAllowedToManageInstitutionError, true>> {
    const memberId = member.id.toString()
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

    return right(true)
  }

  private async validateInstitutionManagerRemoval(
    member: InstitutionMember,
    role: InstitutionMemberRole,
    actorId: string,
  ): Promise<Either<CannotRemoveLastInstitutionManagerError, null>> {
    const memberId = member.id.toString()
    const isDemotingAManager = member.role === InstitutionMemberRole.MANAGER && role !== InstitutionMemberRole.MANAGER

    if (!isDemotingAManager) {
      return right(null)
    }

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

    return right(null)
  }

  private async updateMemberRole(member: InstitutionMember, role: InstitutionMemberRole, actorId: string) {
    const oldRole = member.role
    member.role = role

    await this.institutionMembersRepository.save(member)

    await this.log({
      actorId,
      resourceId: member.id.toString(),
      text: `Cargo do membro ${member.id.toString()} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { role: { old: oldRole, new: role } },
    })

    return { member }
  }
}
