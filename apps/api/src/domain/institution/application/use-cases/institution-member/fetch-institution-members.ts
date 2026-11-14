import { type Either, left, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
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

export interface InstitutionMemberItem {
  member: InstitutionMember
  user: User
}

type FetchInstitutionMembersUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { members: InstitutionMemberItem[] }
>

export class FetchInstitutionMembersUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly usersRepository: UsersRepository,
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

    const institutionMembers = await this.institutionMembersRepository.findManyByInstitutionId(institutionId)

    const users = await Promise.all(institutionMembers.map((member) => this.usersRepository.findById(member.userId)))

    const members = institutionMembers.flatMap((member, index) => {
      const user = users[index]

      if (!user) {
        return []
      }

      return [{ member, user }]
    })

    return right({ members })
  }
}
