import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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

  async execute({
    requestId,
    actorId,
  }: RejectInstitutionMembershipRequestUseCaseRequest): Promise<RejectInstitutionMembershipRequestUseCaseResponse> {
    const requestResult = await this.findRequestOrFail(requestId, actorId)

    if (requestResult.isLeft()) {
      return left(requestResult.value)
    }

    const request = requestResult.value

    const manageResult = await this.canManageInstitution(request, actorId)

    if (manageResult.isLeft()) {
      return left(manageResult.value)
    }

    const { request: membershipRequest } = await this.rejectMembership(request, actorId)

    return right({
      request: membershipRequest,
    })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'institution.membership-request',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findRequestOrFail(
    requestId: string,
    actorId: string,
  ): Promise<Either<InstitutionMembershipRequestNotFoundError, InstitutionMembershipRequest>> {
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

    return right(request)
  }

  private async canManageInstitution(
    request: InstitutionMembershipRequest,
    actorId: string,
  ): Promise<Either<NotAllowedToManageInstitutionError, true>> {
    const requestId = request.id.toString()
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

    return right(true)
  }

  private async rejectMembership(request: InstitutionMembershipRequest, actorId: string) {
    const oldStatus = request.status
    request.status = InstitutionMembershipRequestStatus.REJECTED

    await this.institutionMembershipRequestsRepository.save(request)

    await this.log({
      actorId,
      resourceId: request.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Solicitação de membro na instituição ${request.id.toString()} rejeitada com sucesso.`,
      diff: { status: { old: oldStatus, new: InstitutionMembershipRequestStatus.REJECTED } },
    })

    return { request }
  }
}
