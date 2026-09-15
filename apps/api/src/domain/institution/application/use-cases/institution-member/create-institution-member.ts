import { type Either, left, right } from '@/core/either'
import { InstitutionMember, type InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface CreateInstitutionMemberUseCaseRequest {
  institutionId: string
  actorId: string
  userId: string
  role: InstitutionMemberRole
}

type CreateInstitutionMemberUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError | InstitutionMemberAlreadyExistsError,
  { member: InstitutionMember }
>

export class CreateInstitutionMemberUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    institutionId,
    actorId,
    userId,
    role,
  }: CreateInstitutionMemberUseCaseRequest): Promise<CreateInstitutionMemberUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(institutionId, userId)

    if (existingMember && existingMember.role === role) {
      return left(new InstitutionMemberAlreadyExistsError())
    }

    const member = InstitutionMember.create({
      institutionId,
      userId,
      role,
    })

    await this.institutionMembersRepository.create(member)

    return right({ member })
  }
}
