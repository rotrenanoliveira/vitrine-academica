import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { setupOpenEventCycle } from '@tests/factories/setup-event'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/events/:eventId/participants', () => {
  it('should able to list approved project participants', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle()

    const { project: approvedProject } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      title: 'Projeto aprovado',
    })
    const { project: pendingProject } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      title: 'Projeto pendente',
    })

    const approvedRegistration = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: approvedProject.id.toString() })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: pendingProject.id.toString() })

    await request(app.server)
      .patch(`/api/v1/events/registrations/${approvedRegistration.body.registration.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    const response = await request(app.server).get(`/api/v1/events/${event.id}/participants`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].id).toBe(approvedProject.id.toString())
    expect(response.body.projects[0].title).toBe('Projeto aprovado')
  })

  it('should return empty list when there are no approved project participants', async () => {
    const { event } = await setupOpenEventCycle()

    const response = await request(app.server).get(`/api/v1/events/${event.id}/participants`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(0)
  })

  it('should return 404 for a non-existent event', async () => {
    const response = await request(app.server).get('/api/v1/events/invalid-event-id/participants')

    expect(response.status).toBe(404)
  })
})
