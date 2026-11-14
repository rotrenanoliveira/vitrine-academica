import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { makeProject } from '@tests/factories/make-project'
import { makePublicationNotification } from '@tests/factories/make-publication-notification'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { InMemoryMail } from '@tests/repositories/in-memory-mail'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryPublicationNotificationsRepository } from '@tests/repositories/in-memory-publication-notifications-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { NotificationStatus } from '@/domain/newsletter/enterprise/entities/publication-notification'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { env } from '@/environment-variables'
import { SendPendingNotificationsUseCase } from './send-pending-notifications'

let notificationsRepository: InMemoryPublicationNotificationsRepository
let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let projectsRepository: InMemoryProjectsRepository
let usersRepository: InMemoryUsersRepository
let mail: InMemoryMail
let sut: SendPendingNotificationsUseCase

function setup(projectStatus: ProjectStatus = ProjectStatus.PUBLISHED) {
  const { user: author } = makeUser()
  const { project } = makeProject({ author: author.id, status: projectStatus })
  const { subscription } = makeAuthorSubscription({ authorId: author.id })
  const { notification } = makePublicationNotification({ subscriptionId: subscription.id, projectId: project.id })

  usersRepository.items.push(author)
  projectsRepository.items.push(project)
  subscriptionsRepository.items.push(subscription)
  notificationsRepository.items.push(notification)

  return { author, project, subscription, notification }
}

describe('(UC) - Send Pending Notifications', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryPublicationNotificationsRepository()
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    usersRepository = new InMemoryUsersRepository()
    mail = new InMemoryMail()

    sut = new SendPendingNotificationsUseCase(
      notificationsRepository,
      subscriptionsRepository,
      projectsRepository,
      usersRepository,
      mail,
    )
  })

  it('deve enviar o e-mail e marcar o aviso como enviado, guardando o id do provedor', async () => {
    const { notification } = setup()

    const result = await sut.execute({ webUrl: env.WEB_URL })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value).toEqual({ sent: 1, failed: 0 })
    }

    expect(mail.items).toHaveLength(1)
    expect(notificationsRepository.items[0].status).toBe(NotificationStatus.SENT)
    expect(notificationsRepository.items[0].sentAt).toBeInstanceOf(Date)
    expect(notificationsRepository.items[0].providerMessageId).toBe('mail-1')
    expect(notificationsRepository.items[0].id.toString()).toBe(notification.id.toString())
  })

  it('deve enviar o e-mail para o endereço da assinatura, com o autor, o projeto e os dois links', async () => {
    const { author, project, subscription } = setup()

    await sut.execute({ webUrl: env.WEB_URL })

    const message = mail.items[0]

    expect(message.to).toBe(subscription.email.toLowerCase())
    expect(message.subject).toContain(author.name)
    expect(message.text).toContain(project.title)
    expect(message.text).toContain(`${env.WEB_URL}/projetos/${project.slug}`)
    expect(message.text).toContain(`${env.WEB_URL}/newsletter/cancelar?token=${subscription.unsubscribeToken}`)
  })

  it('deve marcar como falhou e não travar quando o provedor de e-mail dá erro', async () => {
    setup()
    mail.shouldFail = true

    const result = await sut.execute({ webUrl: env.WEB_URL })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value).toEqual({ sent: 0, failed: 1 })
    }

    expect(notificationsRepository.items[0].status).toBe(NotificationStatus.FAILED)
  })

  it.each([SubscriptionStatus.UNSUBSCRIBED, SubscriptionStatus.BOUNCED])(
    'não deve enviar quando a assinatura está com status %s',
    async (status) => {
      const { subscription } = setup()
      subscription.unsubscribe()
      Object.defineProperty(subscription, 'status', { value: status })

      await sut.execute({ webUrl: env.WEB_URL })

      expect(mail.items).toHaveLength(0)
      expect(notificationsRepository.items[0].status).toBe(NotificationStatus.FAILED)
    },
  )

  it.each([ProjectStatus.SKETCH, ProjectStatus.ARCHIVED])(
    'não deve enviar quando o projeto está com status %s',
    async (status) => {
      setup(status)

      await sut.execute({ webUrl: env.WEB_URL })

      expect(mail.items).toHaveLength(0)
      expect(notificationsRepository.items[0].status).toBe(NotificationStatus.FAILED)
    },
  )

  it('não deve enviar quando o autor não existe mais', async () => {
    setup()
    usersRepository.items = []

    await sut.execute({ webUrl: env.WEB_URL })

    expect(mail.items).toHaveLength(0)
    expect(notificationsRepository.items[0].status).toBe(NotificationStatus.FAILED)
  })

  it('não deve reenviar os avisos que já foram enviados', async () => {
    setup()

    await sut.execute({ webUrl: env.WEB_URL })
    const second = await sut.execute({ webUrl: env.WEB_URL })

    expect(mail.items).toHaveLength(1)

    if (second.isRight()) {
      expect(second.value).toEqual({ sent: 0, failed: 0 })
    }
  })

  it('deve continuar com os outros avisos quando um deles falha', async () => {
    setup(ProjectStatus.ARCHIVED)
    setup()

    const result = await sut.execute({ webUrl: env.WEB_URL })

    if (result.isRight()) {
      expect(result.value).toEqual({ sent: 1, failed: 1 })
    }

    expect(mail.items).toHaveLength(1)
  })

  it('deve respeitar o limite de avisos por rodada', async () => {
    setup()
    setup()
    setup()

    const result = await sut.execute({ webUrl: env.WEB_URL, limit: 2 })

    if (result.isRight()) {
      expect(result.value.sent).toBe(2)
    }

    expect(notificationsRepository.items.filter((item) => item.status === NotificationStatus.PENDING)).toHaveLength(1)
  })
})
