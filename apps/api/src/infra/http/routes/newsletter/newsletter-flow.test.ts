import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makePublicationNotificationOnDatabase } from '@tests/factories/make-publication-notification'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { SendPendingNotificationsUseCase } from '@/domain/newsletter/application/use-cases/send-pending-notifications'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { NotificationStatus } from '@/domain/newsletter/enterprise/entities/publication-notification'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePublicationNotificationsRepository } from '@/infra/database/repositories/drizzle-publication-notifications-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeEmail } from '@/infra/mail/make-mail'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

async function setup(
  projectStatus: ProjectStatus = ProjectStatus.SKETCH,
  subscriptionStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE,
) {
  const { accessToken, user: author } = await authenticateUser()
  const { user: follower } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({ author: author.id, status: projectStatus })
  const { subscription } = await makeAuthorSubscriptionOnDatabase({
    subscriberId: follower.id,
    authorId: author.id,
    status: subscriptionStatus,
    ...(subscriptionStatus === SubscriptionStatus.UNSUBSCRIBED ? { unsubscribedAt: new Date() } : {}),
  })

  return { accessToken, author, follower, project, subscription }
}

function publishNow(projectId: string, accessToken: string) {
  return request(app.server)
    .post(`/api/v1/projects/${projectId}/publish-now`)
    .set('Authorization', `Bearer ${accessToken}`)
}

function updateProject(projectId: string, accessToken: string, body: Record<string, unknown>) {
  return request(app.server)
    .put(`/api/v1/projects/${projectId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(body)
}

async function findNotification(subscriptionId: string, projectId: string) {
  return new DrizzlePublicationNotificationsRepository(db).findBySubscriptionAndProject(subscriptionId, projectId)
}

describe('(E2E) - Newsletter: avisos na publicação do projeto', () => {
  afterAll(async () => await app.close())

  it('publicar agora: deve criar um aviso pendente para quem acompanha o autor', async () => {
    const { accessToken, project, subscription } = await setup()

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(200)

    const notification = await findNotification(subscription.id.toString(), project.id.toString())

    expect(notification?.status).toBe(NotificationStatus.PENDING)
    expect(notification?.sentAt ?? null).toBeNull()
  })

  it('editar: mudando o status para publicado, deve criar um aviso pendente', async () => {
    const { accessToken, project, subscription } = await setup()

    const response = await updateProject(project.id.toString(), accessToken, {
      title: project.title,
      description: project.description,
      status: 'PUBLISHED',
    })

    expect(response.status).toBe(200)

    const notification = await findNotification(subscription.id.toString(), project.id.toString())

    expect(notification?.status).toBe(NotificationStatus.PENDING)
  })

  it('agendador: ao publicar o projeto agendado, deve criar um aviso pendente', async () => {
    const { project, subscription } = await setup(ProjectStatus.SCHEDULED)
    await makeProjectScheduledOnDatabase({ projectId: project.id, publishedIn: new Date(Date.now() - 60_000) })

    const response = await request(app.server).post('/api/v1/projects/publish-scheduled')

    expect(response.status).toBe(200)

    const notification = await findNotification(subscription.id.toString(), project.id.toString())

    expect(notification?.status).toBe(NotificationStatus.PENDING)
  })

  it('editar: salvando um rascunho sem publicar, não deve criar aviso', async () => {
    const { accessToken, project, subscription } = await setup()

    const response = await updateProject(project.id.toString(), accessToken, {
      title: 'Título novo',
      description: project.description,
      status: 'SKETCH',
    })

    expect(response.status).toBe(200)
    expect(await findNotification(subscription.id.toString(), project.id.toString())).toBeNull()
  })

  it('publicar agora: com a assinatura cancelada, não deve criar aviso', async () => {
    const { accessToken, project, subscription } = await setup(ProjectStatus.SKETCH, SubscriptionStatus.UNSUBSCRIBED)

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(await findNotification(subscription.id.toString(), project.id.toString())).toBeNull()
  })

  it('publicar agora: quem acompanha outro autor, não deve receber aviso', async () => {
    const { accessToken, project } = await setup()
    const { user: otherAuthor } = await makeUserOnDatabase()
    const { user: otherFollower } = await makeUserOnDatabase()
    const { subscription: unrelated } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: otherFollower.id,
      authorId: otherAuthor.id,
    })

    await publishNow(project.id.toString(), accessToken)

    expect(await findNotification(unrelated.id.toString(), project.id.toString())).toBeNull()
  })

  it('editar: salvando de novo um projeto já publicado, não deve repetir o aviso', async () => {
    const { accessToken, project, subscription } = await setup()

    await publishNow(project.id.toString(), accessToken)
    const first = await findNotification(subscription.id.toString(), project.id.toString())

    const response = await updateProject(project.id.toString(), accessToken, {
      title: 'Título depois de publicado',
      description: project.description,
      status: 'PUBLISHED',
    })

    const pending = await new DrizzlePublicationNotificationsRepository(db).findManyByStatus(
      NotificationStatus.PENDING,
      50,
    )

    expect(response.status).toBe(200)
    expect(pending.filter((item) => item.projectId.toString() === project.id.toString())).toHaveLength(1)
    expect(first?.id.toString()).toBe(pending[0].id.toString())
  })

  it('envio: com os repositórios reais, deve marcar o aviso como enviado e registrar a data', async () => {
    const { project, subscription } = await setup(ProjectStatus.PUBLISHED)
    const { notification } = await makePublicationNotificationOnDatabase({
      subscriptionId: subscription.id,
      projectId: project.id,
    })

    const useCase = new SendPendingNotificationsUseCase(
      new DrizzlePublicationNotificationsRepository(db),
      new DrizzleAuthorSubscriptionsRepository(db),
      new DrizzleProjectsRepository(db),
      new DrizzleUsersRepository(db),
      makeEmail(),
    )

    const result = await useCase.execute({ webUrl: 'https://vitrine.exemplo.com' })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value).toEqual({ sent: 1, failed: 0 })
    }

    const saved = await new DrizzlePublicationNotificationsRepository(db).findById(notification.id.toString())

    expect(saved?.status).toBe(NotificationStatus.SENT)
    expect(saved?.sentAt).toBeInstanceOf(Date)
  })
})
