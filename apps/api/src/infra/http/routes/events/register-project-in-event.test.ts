import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { setupOpenEventCycle } from '@tests/factories/setup-event'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - POST /api/v1/events/:eventId/registrations', () => {
  it('should be able to register a published project in an open event', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    expect(response.status).toBe(201)
    expect(response.body.registration.eventId).toBe(event.id)
    expect(response.body.registration.projectId).toBe(project.id.toString())
    expect(response.body.registration.responsibleUserId).toBe(user.id.toString())
    expect(response.body.registration.status).toBe('PENDING')
  })

  it('should not be able to register a sketch project', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    expect(response.status).toBe(409)
  })

  it('should not be able to register another user project', async () => {
    const { accessToken, event } = await setupOpenEventCycle()
    const other = await authenticateUser()

    const { project } = await makeProjectOnDatabase({ author: other.user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    expect(response.status).toBe(403)
  })

  it('should not be able to register the same project twice', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    expect(response.status).toBe(409)
  })

  it('should not be able to register when event is still in theme selection', async () => {
    const { accessToken, institution, user } = await setupManagerWithInstitution()

    const createResponse = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/events`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ participationScope: 'GLOBAL' })

    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server)
      .post(`/api/v1/events/${createResponse.body.event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    expect(response.status).toBe(409)
  })
})
