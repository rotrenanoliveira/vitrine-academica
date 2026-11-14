import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryPublicationNotificationsRepository } from '@tests/repositories/in-memory-publication-notifications-repository'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { NotificationStatus } from '@/domain/newsletter/enterprise/entities/publication-notification'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { CreatePublicationNotificationsUseCase } from './create-publication-notifications'

let projectsRepository: InMemoryProjectsRepository
let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let notificationsRepository: InMemoryPublicationNotificationsRepository
let sut: CreatePublicationNotificationsUseCase

function publishedProject() {
  const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
  projectsRepository.items.push(project)

  return project
}

describe('(UC) - Create Publication Notifications', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()
    notificationsRepository = new InMemoryPublicationNotificationsRepository()

    sut = new CreatePublicationNotificationsUseCase(
      projectsRepository,
      subscriptionsRepository,
      notificationsRepository,
    )
  })

  it('deve criar um aviso pendente para cada assinatura ativa do autor', async () => {
    const project = publishedProject()
    const { subscription: first } = makeAuthorSubscription({ authorId: project.author })
    const { subscription: second } = makeAuthorSubscription({ authorId: project.author })
    subscriptionsRepository.items.push(first, second)

    const result = await sut.execute({ projectId: project.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.created).toBe(2)
    }

    expect(notificationsRepository.items).toHaveLength(2)
    expect(notificationsRepository.items.every((item) => item.status === NotificationStatus.PENDING)).toBeTruthy()
    expect(
      notificationsRepository.items.every((item) => item.projectId.toString() === project.id.toString()),
    ).toBeTruthy()
  })

  it.each([SubscriptionStatus.UNSUBSCRIBED, SubscriptionStatus.BOUNCED])(
    'não deve criar aviso para assinatura com status %s',
    async (status) => {
      const project = publishedProject()
      const { subscription } = makeAuthorSubscription({ authorId: project.author, status })
      subscriptionsRepository.items.push(subscription)

      const result = await sut.execute({ projectId: project.id.toString() })

      expect(result.isRight()).toBeTruthy()
      expect(notificationsRepository.items).toHaveLength(0)
    },
  )

  it('não deve criar aviso para assinaturas de outros autores', async () => {
    const project = publishedProject()
    const { subscription } = makeAuthorSubscription()
    subscriptionsRepository.items.push(subscription)

    await sut.execute({ projectId: project.id.toString() })

    expect(notificationsRepository.items).toHaveLength(0)
  })

  it('não deve repetir o aviso do mesmo projeto para a mesma assinatura', async () => {
    const project = publishedProject()
    const { subscription } = makeAuthorSubscription({ authorId: project.author })
    subscriptionsRepository.items.push(subscription)

    await sut.execute({ projectId: project.id.toString() })
    const secondResult = await sut.execute({ projectId: project.id.toString() })

    expect(notificationsRepository.items).toHaveLength(1)

    if (secondResult.isRight()) {
      expect(secondResult.value.created).toBe(0)
    }
  })

  it.each([ProjectStatus.SKETCH, ProjectStatus.SCHEDULED, ProjectStatus.ARCHIVED])(
    'não deve criar avisos quando o projeto está com status %s',
    async (status) => {
      const { project } = makeProject({ status })
      projectsRepository.items.push(project)
      const { subscription } = makeAuthorSubscription({ authorId: project.author })
      subscriptionsRepository.items.push(subscription)

      const result = await sut.execute({ projectId: project.id.toString() })

      expect(result.isRight()).toBeTruthy()
      expect(notificationsRepository.items).toHaveLength(0)
    },
  )

  it('não deve criar avisos para um projeto que não existe', async () => {
    const result = await sut.execute({ projectId: 'projeto-inexistente' })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('deve devolver zero quando o autor não tem quem o acompanhe', async () => {
    const project = publishedProject()

    const result = await sut.execute({ projectId: project.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.created).toBe(0)
    }
  })
})
