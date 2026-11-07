import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import { FetchCallApplicationsUseCase } from './fetch-call-applications'

let callsRepository: InMemoryCallsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let usersRepository: InMemoryUsersRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let institutionsRepository: InMemoryInstitutionsRepository
let sut: FetchCallApplicationsUseCase

describe('(UC) - Fetch Call Applications', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    usersRepository = new InMemoryUsersRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    institutionsRepository = new InMemoryInstitutionsRepository()
    sut = new FetchCallApplicationsUseCase(
      callsRepository,
      callApplicationsRepository,
      usersRepository,
      institutionMembersRepository,
      institutionsRepository,
    )
  })

  it('should return the applicants with name, institution and role but without email', async () => {
    const { call } = makeCall()
    const { user } = makeUser({ name: 'Maria Silva', email: 'maria@email.com', status: UserStatus.ACTIVE })
    const { institution } = makeInstitution({ name: 'UMC' })
    const { institution: oldInstitution } = makeInstitution({ name: 'Faculdade Antiga' })
    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const { member: inactiveMember } = makeInstitutionMember({
      institutionId: oldInstitution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.INACTIVE,
    })
    const { application } = makeCallApplication({
      callId: call.id,
      applicantId: user.id,
      message: 'Quero participar',
    })

    callsRepository.items.push(call)
    usersRepository.items.push(user)
    institutionsRepository.items.push(institution, oldInstitution)
    institutionMembersRepository.items.push(member, inactiveMember)
    callApplicationsRepository.items.push(application)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications).toHaveLength(1)

      const { application: returnedApplication, applicant } = result.value.applications[0]

      expect(returnedApplication.message).toBe('Quero participar')
      expect(applicant.name).toBe('Maria Silva')
      expect(applicant.memberships).toEqual([
        {
          institutionId: institution.id.toString(),
          institutionName: 'UMC',
          role: InstitutionMemberRole.STUDENT,
        },
      ])
      expect(Object.keys(applicant).sort()).toEqual(['id', 'memberships', 'name'])
    }
  })

  it('should return the oldest applications first', async () => {
    const { call } = makeCall()
    const { user: firstUser } = makeUser()
    const { user: secondUser } = makeUser()
    const { application: older } = makeCallApplication({
      callId: call.id,
      applicantId: firstUser.id,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    const { application: newer } = makeCallApplication({
      callId: call.id,
      applicantId: secondUser.id,
      createdAt: new Date('2026-02-01T00:00:00Z'),
    })

    callsRepository.items.push(call)
    usersRepository.items.push(firstUser, secondUser)
    callApplicationsRepository.items.push(newer, older)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications.map(({ application }) => application.id.toString())).toEqual([
        older.id.toString(),
        newer.id.toString(),
      ])
    }
  })

  it('should be able to filter the applications by status', async () => {
    const { call } = makeCall()
    const { user: firstUser } = makeUser()
    const { user: secondUser } = makeUser()
    const { application: pending } = makeCallApplication({ callId: call.id, applicantId: firstUser.id })
    const { application: approved } = makeCallApplication({
      callId: call.id,
      applicantId: secondUser.id,
      status: CallApplicationStatus.APPROVED,
    })

    callsRepository.items.push(call)
    usersRepository.items.push(firstUser, secondUser)
    callApplicationsRepository.items.push(pending, approved)

    const result = await sut.execute({
      callId: call.id.toString(),
      authorId: call.authorId.toString(),
      status: CallApplicationStatus.PENDING,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications).toHaveLength(1)
      expect(result.value.applications[0].application.id.toString()).toBe(pending.id.toString())
    }
  })

  it('should not return applications of other calls', async () => {
    const { call } = makeCall()
    const { call: otherCall } = makeCall()
    const { user } = makeUser()
    const { application: otherApplication } = makeCallApplication({ callId: otherCall.id, applicantId: user.id })

    callsRepository.items.push(call, otherCall)
    usersRepository.items.push(user)
    callApplicationsRepository.items.push(otherApplication)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications).toEqual([])
    }
  })

  it('should not be able to fetch the applications as non-owner', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotCallOwnerError)
    }
  })

  it('should not be able to fetch the applications of a call that does not exist', async () => {
    const result = await sut.execute({ callId: 'non-existent', authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })
})
