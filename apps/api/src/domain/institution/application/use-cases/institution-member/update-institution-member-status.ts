import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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
    status,
  }: UpdateInstitutionMemberStatusUseCaseRequest): Promise<UpdateInstitutionMemberStatusUseCaseResponse> {
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

    const oldStatus = member.status
    member.status = status

    await this.institutionMembersRepository.save(member)

    await this.log({
      actorId,
      resourceId: memberId,
      text: `Membro ${memberId} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: oldStatus, new: status } },
    })

    return right({ member })
  }
}
