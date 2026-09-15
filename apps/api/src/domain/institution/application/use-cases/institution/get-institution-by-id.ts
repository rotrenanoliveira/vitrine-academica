import { type Either, left, right } from '@/core/either'
import type { Institution } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface GetInstitutionByIdUseCaseRequest {
  institutionId: string
}

type GetInstitutionByIdUseCaseResponse = Either<InstitutionNotFoundError, { institution: Institution }>

export class GetInstitutionByIdUseCase {
  constructor(private readonly institutionsRepository: InstitutionsRepository) {}

  async execute({ institutionId }: GetInstitutionByIdUseCaseRequest): Promise<GetInstitutionByIdUseCaseResponse> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    return right({ institution })
  }
}
