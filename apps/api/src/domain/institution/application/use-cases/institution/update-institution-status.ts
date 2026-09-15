import { type Either, left, right } from '@/core/either'
import type { Institution, InstitutionStatus } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface UpdateInstitutionStatusUseCaseRequest {
  institutionId: string
  actorId: string
  status: InstitutionStatus
}

type UpdateInstitutionStatusUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { institution: Institution }
>

export class UpdateInstitutionStatusUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    institutionId,
    actorId,
    status,
  }: UpdateInstitutionStatusUseCaseRequest): Promise<UpdateInstitutionStatusUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    institution.status = status

    await this.institutionsRepository.save(institution)

    return right({ institution })
  }
}
