import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchMyInstitutionMembershipsUseCase } from './fetch-my-institution-memberships'

let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: FetchMyInstitutionMembershipsUseCase

describe('(UC) - Fetch My Institution Memberships', () => {
  beforeEach(() => {
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new FetchMyInstitutionMembershipsUseCase(institutionMembersRepository)
  })

  it('should able to fetch an empty list of memberships', async () => {
    const result = await sut.execute({ userId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(0)
    }
  })

  it('should able to fetch my institution memberships', async () => {
    const userId = new UniqueEntityId().toString()

    const { member: first } = makeInstitutionMember({ userId })
    const { member: second } = makeInstitutionMember({ userId })
    const { member: other } = makeInstitutionMember()
    institutionMembersRepository.items.push(first, second, other)

    const result = await sut.execute({ userId })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(2)
    }
  })
})
