import { type Either, left, right } from '@/core/either'
import type { InstitutionMembershipRequest } from '../../../enterprise/entities/institution-membership-request'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionMembershipRequestsRepository } from '../../repositories/institution-membership-requests-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface FetchInstitutionMembershipRequestsUseCaseRequest {
  institutionId: string
  actorId: string
}

type FetchInstitutionMembershipRequestsUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { requests: InstitutionMembershipRequest[] }
>

export class FetchInstitutionMembershipRequestsUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly institutionMembershipRequestsRepository: InstitutionMembershipRequestsRepository,
  ) {}

  async execute({
    institutionId,
    actorId,
  }: FetchInstitutionMembershipRequestsUseCaseRequest): Promise<FetchInstitutionMembershipRequestsUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    const requests = await this.institutionMembershipRequestsRepository.findManyByInstitutionId(institutionId)

    return right({ requests })
  }
}
