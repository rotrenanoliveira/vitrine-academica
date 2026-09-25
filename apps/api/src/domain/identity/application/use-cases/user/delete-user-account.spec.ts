import { makeAccount } from '@tests/factories/make-account'
import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeSession } from '@tests/factories/make-session'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InMemorySessionsRepository } from '@tests/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  InstitutionOrigin,
  type InstitutionProps,
  InstitutionStatus,
} from '@/domain/institution/enterprise/entities/institutions'
import type { DeleteAttachmentUseCase } from '@/domain/storage/application/use-cases/delete-attachment'
import { SoleInstitutionManagerError } from '../../_errors/sole-institution-manager-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { DeleteUserAccountUseCase } from './delete-user-account'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let sessionsRepository: InMemorySessionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let institutionsRepository: InMemoryInstitutionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let deleteAttachment: { execute: ReturnType<typeof vi.fn> }
let sut: DeleteUserAccountUseCase

// Cria um usuário que é gerente de uma instituição (e já coloca tudo nos repositórios)
function setupManager(institutionOverride: Partial<InstitutionProps> = {}) {
  const { user } = makeUser({ status: UserStatus.ACTIVE })
  const { institution } = makeInstitution(institutionOverride)
  const institutionId = institution.id.toString()

  const { member: manager } = makeInstitutionMember({
    institutionId,
    userId: user.id.toString(),
    role: InstitutionMemberRole.MANAGER,
  })

  usersRepository.items.push(user)
  institutionsRepository.items.push(institution)
  institutionMembersRepository.items.push(manager)

  return { user, institution, institutionId, manager }
}

describe('(UC) - Delete User Account', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    sessionsRepository = new InMemorySessionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    institutionsRepository = new InMemoryInstitutionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    deleteAttachment = { execute: vi.fn().mockResolvedValue(right(null)) }

    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new DeleteUserAccountUseCase(
      usersRepository,
      accountsRepository,
      sessionsRepository,
      institutionMembersRepository,
      institutionsRepository,
      deleteAttachment as unknown as DeleteAttachmentUseCase,
      registerLog,
    )
  })

  it('should anonymize the user and mark the account as deleted', async () => {
    const { user } = makeUser({ name: 'Maria Silva', email: 'maria@email.com', status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(usersRepository.items[0].name).toBe('Usuário removido')
    expect(usersRepository.items[0].email).toBe(`deleted-${user.id.toString()}@anonymized.invalid`)
    expect(usersRepository.items[0].status).toBe(UserStatus.DELETED)
  })

  it('should register an audit log when the account is deleted', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    await sut.execute({ userId: user.id.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.DELETE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not be able to delete a user that does not exist', async () => {
    const result = await sut.execute({ userId: 'non-existent' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to delete an account that was already deleted', async () => {
    const { user } = makeUser({ status: UserStatus.DELETED })
    usersRepository.items.push(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to delete when user is the only manager and there are other members', async () => {
    const { user, institution, institutionId, manager } = setupManager()

    const { member: student } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(student)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SoleInstitutionManagerError)
      expect(result.value).toMatchObject({ institutions: [{ id: institutionId, name: institution.name }] })
    }

    // Nada foi alterado
    expect(user.status).toBe(UserStatus.ACTIVE)
    expect(manager.status).toBe(InstitutionMemberStatus.ACTIVE)
    expect(institution.status).toBe(InstitutionStatus.ACTIVE)
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
  })

  it('should be able to delete when there is another active manager', async () => {
    const { user, institution, institutionId, manager } = setupManager()

    const { member: otherManager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(otherManager)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.archivedInstitutions).toEqual([])
    }
    expect(manager.status).toBe(InstitutionMemberStatus.INACTIVE)
    expect(otherManager.status).toBe(InstitutionMemberStatus.ACTIVE)
    expect(institution.status).toBe(InstitutionStatus.ACTIVE)
  })

  it('should archive the institution when the user is alone in it', async () => {
    const { user, institution, institutionId, manager } = setupManager()

    // Membro inativo não conta como "outra pessoa"
    const { member: inactiveStudent } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.INACTIVE,
    })
    institutionMembersRepository.items.push(inactiveStudent)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.archivedInstitutions).toEqual([{ id: institutionId, name: institution.name }])
    }
    expect(institution.status).toBe(InstitutionStatus.ARCHIVED)
    expect(manager.status).toBe(InstitutionMemberStatus.INACTIVE)
  })

  it('should not archive a seed institution', async () => {
    const { user, institution, manager } = setupManager({ origin: InstitutionOrigin.SEED })

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.archivedInstitutions).toEqual([])
    }
    expect(institution.status).toBe(InstitutionStatus.ACTIVE)
    expect(manager.status).toBe(InstitutionMemberStatus.INACTIVE)
  })

  it('should only deactivate the membership when the user is not a manager', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { institution } = makeInstitution()

    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    usersRepository.items.push(user)
    institutionsRepository.items.push(institution)
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(member.status).toBe(InstitutionMemberStatus.INACTIVE)
    expect(institution.status).toBe(InstitutionStatus.ACTIVE)
  })

  it('should revoke all sessions of the user', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    const { session: sessionA } = makeSession({ userId: user.id })
    const { session: sessionB } = makeSession({ userId: user.id })
    const { session: sessionOfSomeoneElse } = makeSession()
    sessionsRepository.items.push(sessionA, sessionB, sessionOfSomeoneElse)

    await sut.execute({ userId: user.id.toString() })

    expect(sessionA.isRevoked()).toBeTruthy()
    expect(sessionB.isRevoked()).toBeTruthy()
    expect(sessionOfSomeoneElse.isRevoked()).toBeFalsy()
  })

  it('should delete the avatar file and clear it from the account', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    const avatarId = new UniqueEntityId()
    const { account } = makeAccount({ userId: user.id, avatarId })
    accountsRepository.items.push(account)

    await sut.execute({ userId: user.id.toString() })

    expect(deleteAttachment.execute).toHaveBeenCalledWith({ attachmentId: avatarId.toString() })
    expect(account.avatarId).toBeNull()
  })

  it('should not try to delete an avatar when the account has none', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    const { account } = makeAccount({ userId: user.id })
    accountsRepository.items.push(account)

    await sut.execute({ userId: user.id.toString() })

    expect(deleteAttachment.execute).not.toHaveBeenCalled()
  })
})
