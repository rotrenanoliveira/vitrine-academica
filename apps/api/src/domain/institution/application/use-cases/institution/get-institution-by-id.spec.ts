import { makeInstitution } from '@tests/factories/make-institution'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { GetInstitutionByIdUseCase } from './get-institution-by-id'

let institutionsRepository: InMemoryInstitutionsRepository
let sut: GetInstitutionByIdUseCase

describe('(UC) - Get Institution By Id', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    sut = new GetInstitutionByIdUseCase(institutionsRepository)
  })

  it('should able to get an institution by id', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const result = await sut.execute({ institutionId: institution.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institution.id).toEqual(institution.id)
    }
  })

  it('should not be able to get an institution by id that does not exist', async () => {
    const result = await sut.execute({ institutionId: 'non-existent' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
