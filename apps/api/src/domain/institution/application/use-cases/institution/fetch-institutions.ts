import { type Either, right } from '@/core/either'
import type { Institution } from '../../../enterprise/entities/institutions'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

type FetchInstitutionsUseCaseResponse = Either<never, { institutions: Institution[] }>

export class FetchInstitutionsUseCase {
  constructor(private readonly institutionsRepository: InstitutionsRepository) {}

  async execute(): Promise<FetchInstitutionsUseCaseResponse> {
    const institutions = await this.institutionsRepository.findAll()

    return right({ institutions })
  }
}
