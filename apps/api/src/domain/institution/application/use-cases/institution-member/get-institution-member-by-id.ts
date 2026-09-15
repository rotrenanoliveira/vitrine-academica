import { type Either, left, right } from '@/core/either'
import type { InstitutionMember } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'

interface GetInstitutionMemberByIdUseCaseRequest {
  memberId: string
  actorId: string
}

type GetInstitutionMemberByIdUseCaseResponse = Either<
  InstitutionMemberNotFoundError | NotAllowedToManageInstitutionError,
  { member: InstitutionMember }
>

export class GetInstitutionMemberByIdUseCase {
  constructor(private readonly institutionMembersRepository: InstitutionMembersRepository) {}

  async execute({
    memberId,
    actorId,
  }: GetInstitutionMemberByIdUseCaseRequest): Promise<GetInstitutionMemberByIdUseCaseResponse> {
    const member = await this.institutionMembersRepository.findById(memberId)

    if (!member) {
      return left(new InstitutionMemberNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(
      this.institutionMembersRepository,
      member.institutionId,
      actorId,
    )

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    return right({ member })
  }
}
