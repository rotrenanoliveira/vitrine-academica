import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import {
  type InstitutionMembershipRequest,
  InstitutionMembershipRequestStatus,
} from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMembershipRequestNotFoundError } from '../../_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionMembershipRequestsRepository } from '../../repositories/institution-membership-requests-repository'

interface RejectInstitutionMembershipRequestUseCaseRequest {
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

type RejectInstitutionMembershipRequestUseCaseResponse = Either<
  InstitutionMembershipRequestNotFoundError | NotAllowedToManageInstitutionError,
  { request: InstitutionMembershipRequest }
>

export class RejectInstitutionMembershipRequestUseCase {
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
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    requestId,
    actorId,
  }: RejectInstitutionMembershipRequestUseCaseRequest): Promise<RejectInstitutionMembershipRequestUseCaseResponse> {
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

    const oldStatus = request.status
    request.status = InstitutionMembershipRequestStatus.REJECTED

    await this.institutionMembershipRequestsRepository.save(request)

    await this.log({
      actorId,
      resourceId: requestId,
      status: AuditLogStatus.SUCCESS,
      text: `Solicitação de membro na instituição ${requestId} rejeitada com sucesso.`,
      diff: { status: { old: oldStatus, new: InstitutionMembershipRequestStatus.REJECTED } },
    })

    return right({ request })
  }
}
