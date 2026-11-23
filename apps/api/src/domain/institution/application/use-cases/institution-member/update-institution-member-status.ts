import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { InstitutionMember, InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'

interface UpdateInstitutionMemberStatusUseCaseRequest {
  memberId: string
  actorId: string
  status: InstitutionMemberStatus
}

type UpdateInstitutionMemberStatusUseCaseResponse = Either<
  InstitutionMemberNotFoundError | NotAllowedToManageInstitutionError,
  { member: InstitutionMember }
>

export class UpdateInstitutionMemberStatusUseCase {
  constructor(
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    memberId,
    actorId,
    status,
  }: UpdateInstitutionMemberStatusUseCaseRequest): Promise<UpdateInstitutionMemberStatusUseCaseResponse> {
    const memberResult = await this.findMemberOrFail(memberId, actorId)

    if (memberResult.isLeft()) {
      return left(memberResult.value)
    }

    const member = memberResult.value

    const manageResult = await this.canManageInstitution(member, actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const { member: updatedMember } = await this.updateMemberStatus(member, status, actorId)

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

  private async updateMemberStatus(member: InstitutionMember, status: InstitutionMemberStatus, actorId: string) {
    const oldStatus = member.status
    member.status = status

    await this.institutionMembersRepository.save(member)

    await this.log({
      actorId,
      resourceId: member.id.toString(),
      text: `Membro ${member.id.toString()} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: oldStatus, new: status } },
    })

    return { member }
  }
}
