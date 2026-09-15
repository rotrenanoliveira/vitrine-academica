import { type Either, left, right } from '@/core/either'
import type { InstitutionMember, InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'

interface UpdateInstitutionMemberStatusUseCaseRequest {
  memberId: string
  actorId: string
  status: InstitutionMemberStatus
}

type UpdateInstitutionMemberStatusUseCaseResponse = Either<
  InstitutionMemberNotFoundError | NotAllowedToManageInstitutionError,
  { member: InstitutionMember }
>

export class UpdateInstitutionMemberStatusUseCase {
  constructor(private readonly institutionMembersRepository: InstitutionMembersRepository) {}

  async execute({
    memberId,
    actorId,
    status,
  }: UpdateInstitutionMemberStatusUseCaseRequest): Promise<UpdateInstitutionMemberStatusUseCaseResponse> {
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

    member.status = status

    await this.institutionMembersRepository.save(member)

    return right({ member })
  }
}
