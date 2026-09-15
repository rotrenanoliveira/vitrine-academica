import { type Either, left, right } from '@/core/either'
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
  ) {}

  async execute({
    requestId,
    actorId,
  }: RejectInstitutionMembershipRequestUseCaseRequest): Promise<RejectInstitutionMembershipRequestUseCaseResponse> {
    const request = await this.institutionMembershipRequestsRepository.findById(requestId)

    if (!request) {
      return left(new InstitutionMembershipRequestNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(
      this.institutionMembersRepository,
      request.institutionId,
      actorId,
    )

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    request.status = InstitutionMembershipRequestStatus.REJECTED

    await this.institutionMembershipRequestsRepository.save(request)

    return right({ request })
  }
}
