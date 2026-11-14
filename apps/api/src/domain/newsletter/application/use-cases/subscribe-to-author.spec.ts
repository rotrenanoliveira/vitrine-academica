import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { makeProject } from '@tests/factories/make-project'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { AlreadyFollowingAuthorError } from '@/domain/newsletter/application/_errors/already-following-author-error'
import { AuthorNotFollowableError } from '@/domain/newsletter/application/_errors/author-not-followable-error'
import { CannotFollowYourselfError } from '@/domain/newsletter/application/_errors/cannot-follow-yourself-error'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { SubscribeToAuthorUseCase } from './subscribe-to-author'

let usersRepository: InMemoryUsersRepository
let projectsRepository: InMemoryProjectsRepository
let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: SubscribeToAuthorUseCase

function setup() {
  const { user: subscriber } = makeUser({ status: UserStatus.ACTIVE })
  const { user: author } = makeUser({ status: UserStatus.ACTIVE })
  const { project } = makeProject({ author: author.id, status: ProjectStatus.PUBLISHED })

  usersRepository.items.push(subscriber, author)
  projectsRepository.items.push(project)

  return { subscriber, author }
}

describe('(UC) - Subscribe To Author', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    projectsRepository = new InMemoryProjectsRepository()
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new SubscribeToAuthorUseCase(usersRepository, projectsRepository, subscriptionsRepository, registerLog)
  })

  it('deve acompanhar um autor, criando uma assinatura ativa com o e-mail da conta', async () => {
    const { subscriber, author } = setup()

    const result = await sut.execute({ subscriberId: subscriber.id.toString(), authorId: author.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.subscription.subscriberId.toString()).toBe(subscriber.id.toString())
      expect(result.value.subscription.authorId.toString()).toBe(author.id.toString())
      expect(result.value.subscription.email).toBe(subscriber.email)
      expect(result.value.subscription.status).toBe(SubscriptionStatus.ACTIVE)
      expect(result.value.subscription.unsubscribeToken).toHaveLength(64)
    }

    expect(subscriptionsRepository.items).toHaveLength(1)
  })

  it('deve registrar um log de auditoria quando a assinatura é criada', async () => {
    const { subscriber, author } = setup()

    await sut.execute({ subscriberId: subscriber.id.toString(), authorId: author.id.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    expect(auditLogsRepository.items[0].resource).toBe('author.subscription')
  })

  it('não deve permitir que a pessoa acompanhe a si mesma', async () => {
    const { author } = setup()

    const result = await sut.execute({ subscriberId: author.id.toString(), authorId: author.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(subscriptionsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotFollowYourselfError)
    }
  })

  it('não deve acompanhar quando a pessoa não existe', async () => {
    const { author } = setup()

    const result = await sut.execute({
      subscriberId: new UniqueEntityId().toString(),
      authorId: author.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it.each([UserStatus.INACTIVE, UserStatus.BLOCKED, UserStatus.DELETED, UserStatus.PENDING])(
    'não deve acompanhar quando a pessoa está com status %s',
    async (status) => {
      const { author } = setup()
      const { user: unavailable } = makeUser({ status })
      usersRepository.items.push(unavailable)

      const result = await sut.execute({ subscriberId: unavailable.id.toString(), authorId: author.id.toString() })

      expect(result.isLeft()).toBeTruthy()
      expect(subscriptionsRepository.items).toHaveLength(0)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserUnavailableError)
      }
    },
  )

  it('não deve acompanhar um autor que não existe', async () => {
    const { subscriber } = setup()

    const result = await sut.execute({
      subscriberId: subscriber.id.toString(),
      authorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('não deve acompanhar um autor sem projeto publicado', async () => {
    const { user: subscriber } = makeUser({ status: UserStatus.ACTIVE })
    const { user: author } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ author: author.id, status: ProjectStatus.SKETCH })
    usersRepository.items.push(subscriber, author)
    projectsRepository.items.push(project)

    const result = await sut.execute({ subscriberId: subscriber.id.toString(), authorId: author.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(subscriptionsRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AuthorNotFollowableError)
    }
  })

  it('não deve acompanhar um autor que já está sendo acompanhado', async () => {
    const { subscriber, author } = setup()
    const { subscription } = makeAuthorSubscription({ subscriberId: subscriber.id, authorId: author.id })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ subscriberId: subscriber.id.toString(), authorId: author.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(subscriptionsRepository.items).toHaveLength(1)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AlreadyFollowingAuthorError)
    }
  })

  it('deve reativar a mesma assinatura de quem cancelou e acompanha de novo', async () => {
    const { subscriber, author } = setup()
    const { subscription } = makeAuthorSubscription({
      subscriberId: subscriber.id,
      authorId: author.id,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    })
    subscriptionsRepository.items.push(subscription)
    const token = subscription.unsubscribeToken

    const result = await sut.execute({ subscriberId: subscriber.id.toString(), authorId: author.id.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items).toHaveLength(1)
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.ACTIVE)
    expect(subscriptionsRepository.items[0].unsubscribeToken).toBe(token)
    expect(subscriptionsRepository.items[0].unsubscribedAt).toBeNull()
  })
})
