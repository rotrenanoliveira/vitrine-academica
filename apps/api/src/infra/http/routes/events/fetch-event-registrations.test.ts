import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { setupOpenEventCycle } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/events/:eventId/registrations', () => {
  it('should be able tp list pending registrations with projects for managers', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      title: 'Projeto inscrito',
    })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'PENDING' })

    expect(response.status).toBe(200)
    expect(response.body.registrations).toHaveLength(1)
    expect(response.body.registrations[0].projectId).toBe(project.id.toString())
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].title).toBe('Projeto inscrito')
  })

  it('should be able to list approved registrations', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })

    const registrationResponse = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    await request(app.server)
      .patch(`/api/v1/events/registrations/${registrationResponse.body.registration.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    const pending = await request(app.server)
      .get(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'PENDING' })

    const approved = await request(app.server)
      .get(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'APPROVED' })

    expect(pending.status).toBe(200)
    expect(pending.body.registrations).toHaveLength(0)
    expect(approved.status).toBe(200)
    expect(approved.body.registrations).toHaveLength(1)
    expect(approved.body.registrations[0].status).toBe('APPROVED')
  })

  it('should not be able to allow non-managers to list registrations', async () => {
    const { event } = await setupOpenEventCycle()
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })
})
