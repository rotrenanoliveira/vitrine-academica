import { makeRatingCriterion } from '@tests/factories/make-rating-criterion'
import { InMemoryRatingCriteriaRepository } from '@tests/repositories/in-memory-rating-criteria-repository'
import { ListActiveRatingCriteriaUseCase } from './list-active-rating-criteria'

let criteriaRepository: InMemoryRatingCriteriaRepository
let sut: ListActiveRatingCriteriaUseCase

describe('(UC) - List Active Rating Criteria', () => {
  beforeEach(() => {
    criteriaRepository = new InMemoryRatingCriteriaRepository()
    sut = new ListActiveRatingCriteriaUseCase(criteriaRepository)
  })

  it('should be able to list active and valid rating criteria', async () => {
    const active = makeRatingCriterion({ name: 'Ativo', active: true }).criterion
    const inactive = makeRatingCriterion({ name: 'Inativo', active: false }).criterion
    const expired = makeRatingCriterion({
      name: 'Expirado',
      active: true,
      validFrom: new Date('2020-01-01'),
      validUntil: new Date('2020-12-31'),
    }).criterion

    criteriaRepository.items.push(active, inactive, expired)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.criteria).toHaveLength(1)
      expect(result.value.criteria[0].name).toBe('Ativo')
    }
  })
})
