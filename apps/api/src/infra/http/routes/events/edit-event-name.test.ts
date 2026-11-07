import { randomUUID } from 'node:crypto'
import { appForTest as app } from '@tests/app'
import { setupManagerWithEventCycle } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - PATCH /api/v1/events/:eventId', () => {
  it('should be able to edit event name as institution manager', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle({ name: 'Nome antigo' })

    const response = await request(app.server)
      .patch(`/api/v1/events/${event.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Nome atualizado' })

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.event.name).toBe('Nome atualizado')
  })

  it('should not be able to edit event name when not allowed', async () => {
    const { event } = await setupManagerWithEventCycle()
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .patch(`/api/v1/events/${event.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Hack' })

    expect(response.status).toBe(403)
  })

  it('should not be able to edit a non-existent event', async () => {
    const { accessToken } = await authenticateUser()
    const invalidEventId = randomUUID()

    const response = await request(app.server)
      .patch(`/api/v1/events/${invalidEventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Qualquer' })

    expect(response.status).toBe(404)
  })
})
