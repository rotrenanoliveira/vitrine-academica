import { type Either, right } from '@/core/either'
import type { InstitutionMember } from '../../../enterprise/entities/institution-member'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'

interface FetchMyInstitutionMembershipsUseCaseRequest {
  userId: string
}

type FetchMyInstitutionMembershipsUseCaseResponse = Either<
  never,
  { members: InstitutionMember[] }
>

export class FetchMyInstitutionMembershipsUseCase {
  constructor(private readonly institutionMembersRepository: InstitutionMembersRepository) {}

  async execute({
    userId,
  }: FetchMyInstitutionMembershipsUseCaseRequest): Promise<FetchMyInstitutionMembershipsUseCaseResponse> {
    const members = await this.institutionMembersRepository.findManyByUserId(userId)

    return right({ members })
  }
}
