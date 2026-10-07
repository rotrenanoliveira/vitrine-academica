import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMember, InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import {
  type InstitutionMembershipRequest,
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestNotFoundError } from '../../_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionMembershipRequestsRepository } from '../../repositories/institution-membership-requests-repository'

interface ApproveInstitutionMembershipRequestUseCaseRequest {
  requestId: string
  actorId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type ApproveInstitutionMembershipRequestUseCaseResponse = Either<
  InstitutionMembershipRequestNotFoundError | NotAllowedToManageInstitutionError | InstitutionMemberAlreadyExistsError,
  { request: InstitutionMembershipRequest; member: InstitutionMember }
>

function mapRequestRoleToMemberRole(role: InstitutionMembershipRequestRole): InstitutionMemberRole {
  switch (role) {
    case InstitutionMembershipRequestRole.STUDENT:
      return InstitutionMemberRole.STUDENT
    case InstitutionMembershipRequestRole.PROFESSOR:
      return InstitutionMemberRole.PROFESSOR
    case InstitutionMembershipRequestRole.TEACHER:
      return InstitutionMemberRole.TEACHER
    case InstitutionMembershipRequestRole.MANAGER:
      return InstitutionMemberRole.MANAGER
    case InstitutionMembershipRequestRole.ADMINISTRATIVE_OFFICE:
      return InstitutionMemberRole.ADMINISTRATIVE_OFFICE
  }
}

export class ApproveInstitutionMembershipRequestUseCase {
  constructor(
    private readonly institutionMembershipRequestsRepository: InstitutionMembershipRequestsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'institution.membership-request',
      resourceId,
      status,
      text,
      diff: diff ?? null,
    })
  }

  async execute({
    requestId,
    actorId,
  }: ApproveInstitutionMembershipRequestUseCaseRequest): Promise<ApproveInstitutionMembershipRequestUseCaseResponse> {
    const request = await this.institutionMembershipRequestsRepository.findById(requestId)

    if (!request) {
      await this.log({
        actorId,
        resourceId: requestId,
        text: `Solicitação de membro na instituição ${requestId} não encontrada.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionMembershipRequestNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(
      this.institutionMembersRepository,
      request.institutionId,
      actorId,
    )

    if (!isAllowedToManage) {
      await this.log({
        actorId,
        resourceId: requestId,
        text: `Usuário ${actorId} não tem permissão para gerenciar a instituição ${requestId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotAllowedToManageInstitutionError())
    }

    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(
      request.institutionId,
      request.userId,
    )

    if (existingMember && existingMember.role === mapRequestRoleToMemberRole(request.role)) {
      await this.log({
        actorId,
        resourceId: requestId,
        text: `Usuário ${request.userId} já é membro da instituição ${request.institutionId} como ${mapRequestRoleToMemberRole(request.role)}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionMemberAlreadyExistsError())
    }

    const oldStatus = request.status
    request.status = InstitutionMembershipRequestStatus.APPROVED

    const member = InstitutionMember.create({
      institutionId: request.institutionId,
      userId: request.userId,
      role: mapRequestRoleToMemberRole(request.role),
    })

    await this.institutionMembershipRequestsRepository.save(request)
    await this.institutionMembersRepository.create(member)

    await this.log({
      actorId,
      resourceId: requestId,
      status: AuditLogStatus.SUCCESS,
      text: `Solicitação de membro na instituição ${requestId} aprovada com sucesso.`,
      diff: {
        status: { old: oldStatus, new: InstitutionMembershipRequestStatus.APPROVED },
        memberId: { old: null, new: member.id.toString() },
      },
    })

    return right({ request, member })
  }
}
