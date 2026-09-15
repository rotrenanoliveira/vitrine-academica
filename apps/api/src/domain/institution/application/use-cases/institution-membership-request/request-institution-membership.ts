import { type Either, left, right } from '@/core/either'
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
  ) {}

  async execute({
    institutionId,
    userId,
    role,
    proofAttachmentId,
  }: RequestInstitutionMembershipUseCaseRequest): Promise<RequestInstitutionMembershipUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    if (institution.shouldProof && !proofAttachmentId) {
      return left(new MembershipProofRequiredError())
    }

    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(institutionId, userId)

    if (existingMember) {
      return left(new InstitutionMemberAlreadyExistsError())
    }

    const pendingRequest = await this.institutionMembershipRequestsRepository.findPendingByInstitutionAndUser(
      institutionId,
      userId,
    )

    if (pendingRequest) {
      return left(new InstitutionMembershipRequestAlreadyExistsError())
    }

    const request = InstitutionMembershipRequest.create({
      institutionId,
      userId,
      role,
      proofAttachmentId,
    })

    await this.institutionMembershipRequestsRepository.create(request)

    return right({ request })
  }
}
