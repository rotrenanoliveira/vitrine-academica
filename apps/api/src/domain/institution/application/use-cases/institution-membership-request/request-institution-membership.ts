import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import {
  InstitutionMembershipRequest,
  type InstitutionMembershipRequestRole,
} from '../../../enterprise/entities/institution-membership-request'
import type { Institution } from '../../../enterprise/entities/institutions'
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

type CreateMembershipRequestInput = {
  institutionId: string
  userId: string
  role: InstitutionMembershipRequestRole
  proofAttachmentId?: string | null
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

  async execute({
    institutionId,
    userId,
    role,
    proofAttachmentId,
  }: RequestInstitutionMembershipUseCaseRequest): Promise<RequestInstitutionMembershipUseCaseResponse> {
    const institutionResult = await this.findInstitutionOrFail(institutionId, userId)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const institution = institutionResult.value

    const proofResult = await this.validateProof(institution, userId, proofAttachmentId)

    if (proofResult.isLeft()) {
      return left(proofResult.value)
    }

    const memberResult = await this.validateMembership(institutionId, userId)

    if (memberResult.isLeft()) {
      return left(memberResult.value)
    }

    const membershipRequestResult = await this.validateMembershipRequest(institutionId, userId)

    if (membershipRequestResult.isLeft()) {
      return left(membershipRequestResult.value)
    }

    const request = await this.createMembershipRequest({
      institutionId,
      userId,
      role,
      proofAttachmentId,
    })

    return right({ request })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'institution.membership-request',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  private async findInstitutionOrFail(
    institutionId: string,
    userId: string,
  ): Promise<Either<InstitutionNotFoundError, Institution>> {
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

    return right(institution)
  }

  private async validateProof(
    institution: Institution,
    userId: string,
    proofAttachmentId?: string | null,
  ): Promise<Either<MembershipProofRequiredError, null>> {
    if (institution.shouldProof && !proofAttachmentId) {
      await this.log({
        actorId: userId,
        resourceId: institution.id.toString(),
        text: `Instituição ${institution.id.toString()} requer comprovante.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new MembershipProofRequiredError())
    }

    return right(null)
  }

  private async validateMembership(
    institutionId: string,
    userId: string,
  ): Promise<Either<InstitutionMemberAlreadyExistsError, null>> {
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

    return right(null)
  }

  private async validateMembershipRequest(
    institutionId: string,
    userId: string,
  ): Promise<Either<InstitutionMembershipRequestAlreadyExistsError, null>> {
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

    return right(null)
  }

  private async createMembershipRequest(input: CreateMembershipRequestInput) {
    const request = InstitutionMembershipRequest.create({
      institutionId: input.institutionId,
      userId: input.userId,
      role: input.role,
      proofAttachmentId: input.proofAttachmentId,
    })

    await this.institutionMembershipRequestsRepository.create(request)

    await this.log({
      actorId: input.userId,
      resourceId: request.id.toString(),
      text: `Usuário ${input.userId} solicitou ser ${input.role} na instituição ${input.institutionId} com sucesso.`,
      status: AuditLogStatus.SUCCESS,
    })

    return request
  }
}
