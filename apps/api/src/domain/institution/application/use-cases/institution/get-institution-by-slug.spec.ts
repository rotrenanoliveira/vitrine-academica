import { makeInstitution } from '@tests/factories/make-institution'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { GetInstitutionBySlugUseCase } from './get-institution-by-slug'

let institutionsRepository: InMemoryInstitutionsRepository
let sut: GetInstitutionBySlugUseCase

describe('(UC) - Get Institution By Slug', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    sut = new GetInstitutionBySlugUseCase(institutionsRepository)
  })

  it('should able to get an institution by slug', async () => {
    const { institution } = makeInstitution({ name: 'Universidade Federal' })
    institutionsRepository.items.push(institution)

    const result = await sut.execute({ slug: institution.slug.value })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institution.id).toEqual(institution.id)
    }
  })

  it('should not be able to get an institution by slug that does not exist', async () => {
    const result = await sut.execute({ slug: 'nao-existe' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
