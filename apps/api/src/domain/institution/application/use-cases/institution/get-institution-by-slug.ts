import { type Either, left, right } from '@/core/either'
import type { Institution } from '../../../enterprise/entities/institutions'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface GetInstitutionBySlugUseCaseRequest {
  slug: string
}

type GetInstitutionBySlugUseCaseResponse = Either<InstitutionNotFoundError, { institution: Institution }>

export class GetInstitutionBySlugUseCase {
  constructor(private readonly institutionsRepository: InstitutionsRepository) {}

  async execute({ slug }: GetInstitutionBySlugUseCaseRequest): Promise<GetInstitutionBySlugUseCaseResponse> {
    const institution = await this.institutionsRepository.findBySlug(slug)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    return right({ institution })
  }
}
