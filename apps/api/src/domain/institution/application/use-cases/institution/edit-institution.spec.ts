import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { EditInstitutionUseCase } from './edit-institution'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: EditInstitutionUseCase

describe('(UC) - Edit Institution', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new EditInstitutionUseCase(institutionsRepository, institutionMembersRepository)
  })

  it('should able to edit an institution as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
      name: 'Novo nome',
      description: 'Nova descrição',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.institution.name).toBe('Novo nome')
      expect(result.value.institution.description).toBe('Nova descrição')
    }
  })

  it('should not be able to edit an institution when not authorized', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: new UniqueEntityId().toString(),
      name: 'Hack',
      description: 'Hack',
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to edit an institution that does not exist', async () => {
    const result = await sut.execute({
      institutionId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
      name: 'Nome',
      description: 'Descrição',
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
