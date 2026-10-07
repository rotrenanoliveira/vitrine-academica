import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import {
  InstitutionMembershipRequest,
  type InstitutionMembershipRequestRole,
} from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestAlreadyExistsError } from '../../_errors/institution-membership-request-already-exists-error'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { MembershipProofRequiredError } from '../../_errors/membership-proof-required-error'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionMembershipRequestsRepository } from '../../repositories/institution-membership-requests-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface RequestInstitutionMembershipUseCaseRequest {
  institutionId: string
  userId: string
  role: InstitutionMembershipRequestRole
  proofAttachmentId?: string | null
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type RequestInstitutionMembershipUseCaseResponse = Either<
  | InstitutionNotFoundError
  | MembershipProofRequiredError
  | InstitutionMemberAlreadyExistsError
  | InstitutionMembershipRequestAlreadyExistsError,
  { request: InstitutionMembershipRequest }
>

export class RequestInstitutionMembershipUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly institutionMembershipRequestsRepository: InstitutionMembershipRequestsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'institution.membership-request',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  async execute({
    institutionId,
    userId,
    role,
    proofAttachmentId,
  }: RequestInstitutionMembershipUseCaseRequest): Promise<RequestInstitutionMembershipUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      await this.log({
        actorId: userId,
        resourceId: institutionId,
        text: `Instituição ${institutionId} não encontrada.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionNotFoundError())
    }

    if (institution.shouldProof && !proofAttachmentId) {
      await this.log({
        actorId: userId,
        resourceId: institutionId,
        text: `Instituição ${institutionId} requer comprovante.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new MembershipProofRequiredError())
    }

    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(institutionId, userId)

    if (existingMember) {
      await this.log({
        actorId: userId,
        resourceId: existingMember.id.toString(),
        text: `Usuário ${userId} já é membro da instituição ${institutionId} como ${existingMember.role}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionMemberAlreadyExistsError())
    }

    const pendingRequest = await this.institutionMembershipRequestsRepository.findPendingByInstitutionAndUser(
      institutionId,
      userId,
    )

    if (pendingRequest) {
      await this.log({
        actorId: userId,
        resourceId: pendingRequest.id.toString(),
        text: `Solicitação de membro na instituição ${pendingRequest.id.toString()} já existe.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionMembershipRequestAlreadyExistsError())
    }

    const request = InstitutionMembershipRequest.create({
      institutionId,
      userId,
      role,
      proofAttachmentId,
    })

    await this.institutionMembershipRequestsRepository.create(request)

    await this.log({
      actorId: userId,
      resourceId: request.id.toString(),
      text: `Usuário ${userId} solicitou ser ${role} na instituição ${institutionId} com sucesso.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ request })
  }
}
