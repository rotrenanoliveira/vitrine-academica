import { type Either, left, right } from '@/core/either'
import type { Institution } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface EditInstitutionUseCaseRequest {
  institutionId: string
  actorId: string
  name: string
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

type EditInstitutionUseCaseResponse = Either<
  InstitutionNotFoundError | NotAllowedToManageInstitutionError,
  { institution: Institution }
>

export class EditInstitutionUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    institutionId,
    actorId,
    name,
    description,
    shouldProof,
    shouldVerify,
    domain,
  }: EditInstitutionUseCaseRequest): Promise<EditInstitutionUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    institution.name = name
    institution.description = description

    if (shouldProof !== undefined) {
      institution.shouldProof = shouldProof
    }

    if (shouldVerify !== undefined) {
      institution.shouldVerify = shouldVerify
    }

    if (domain !== undefined) {
      institution.domain = domain
    }

    await this.institutionsRepository.save(institution)

    return right({ institution })
  }
}
