import { makeInstitution } from '@tests/factories/make-institution'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionType } from '../../../enterprise/entities/institutions'
import { InstitutionAlreadyExistsError } from '../../_errors/institution-already-exists-error'
import { RegisterInstitutionUseCase } from './register-institution'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: RegisterInstitutionUseCase

describe('(UC) - Register Institution', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new RegisterInstitutionUseCase(institutionsRepository, institutionMembersRepository)
  })

  it('should able to register a new institution and create manager membership', async () => {
    const registerBy = new UniqueEntityId().toString()

    const result = await sut.execute({
      name: 'Universidade Federal',
      type: InstitutionType.UNIVERSITY,
      description: 'Uma universidade',
      registerBy,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institution.name).toBe('Universidade Federal')
      expect(result.value.institution.slug.value).toBe('universidade-federal')
      expect(result.value.member.role).toBe(InstitutionMemberRole.MANAGER)
      expect(result.value.member.userId).toBe(registerBy)
      expect(institutionsRepository.items).toHaveLength(1)
      expect(institutionMembersRepository.items).toHaveLength(1)
    }
  })

  it('should not be able to register an institution with same slug', async () => {
    const { institution } = makeInstitution({ name: 'Universidade Federal' })
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      name: 'Universidade Federal',
      type: InstitutionType.UNIVERSITY,
      description: 'Outra descrição',
      registerBy: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionAlreadyExistsError)
    }
  })
})
