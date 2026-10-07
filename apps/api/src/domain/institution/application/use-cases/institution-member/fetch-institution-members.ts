import { type Either, left, right } from '@/core/either'
import type { InstitutionMember } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface FetchInstitutionMembersUseCaseRequest {
  institutionId: string
  actorId: string
}

type FetchInstitutionMembersUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { members: InstitutionMember[] }
>

export class FetchInstitutionMembersUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    institutionId,
    actorId,
  }: FetchInstitutionMembersUseCaseRequest): Promise<FetchInstitutionMembersUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    const members = await this.institutionMembersRepository.findManyByInstitutionId(institutionId)

    return right({ members })
  }
}
