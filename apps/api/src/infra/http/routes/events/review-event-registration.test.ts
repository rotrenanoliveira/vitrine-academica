import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { setupOpenEventCycle } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - PATCH /api/v1/events/registrations/:registrationId/review', () => {
  it('should be able to approve a pending registration', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })

    const registrationResponse = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    const registrationId = registrationResponse.body.registration.id

    const response = await request(app.server)
      .patch(`/api/v1/events/registrations/${registrationId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(200)
    expect(response.body.registration.status).toBe('APPROVED')
    expect(response.body.registration.reviewedByUserId).toBe(user.id.toString())
  })

  it('should be able to reject a pending registration with reason', async () => {
    const { accessToken, event, user } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })

    const registrationResponse = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId: project.id.toString() })

    const registrationId = registrationResponse.body.registration.id

    const response = await request(app.server)
      .patch(`/api/v1/events/registrations/${registrationId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'REJECT', reason: 'Fora do tema' })

    expect(response.status).toBe(200)
    expect(response.body.registration.status).toBe('REJECTED')
    expect(response.body.registration.reviewReason).toBe('Fora do tema')
  })

  it('should not be able to allow non-managers to review registrations', async () => {
    const { accessToken: token, event, user } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const registrationResponse = await request(app.server)
      .post(`/api/v1/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: project.id.toString() })

    const registrationId = registrationResponse.body.registration.id
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .patch(`/api/v1/events/registrations/${registrationId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(403)
  })

  it('should return 404 for a non-existent registration', async () => {
    const { accessToken } = await setupOpenEventCycle()

    const response = await request(app.server)
      .patch('/api/v1/events/registrations/invalid-registration-id/review')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(404)
  })
})
