import { makeInstitution } from '@tests/factories/make-institution'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { FetchInstitutionsUseCase } from './fetch-institutions'

let institutionsRepository: InMemoryInstitutionsRepository
let sut: FetchInstitutionsUseCase

describe('(UC) - Fetch Institutions', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    sut = new FetchInstitutionsUseCase(institutionsRepository)
  })

  it('should able to fetch an empty list of institutions', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institutions).toHaveLength(0)
    }
  })

  it('should able to fetch all institutions', async () => {
    const { institution: first } = makeInstitution()
    const { institution: second } = makeInstitution()
    institutionsRepository.items.push(first, second)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institutions).toHaveLength(2)
    }
  })
})
