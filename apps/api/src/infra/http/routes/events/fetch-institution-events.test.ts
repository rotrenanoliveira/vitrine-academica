import { appForTest as app } from '@tests/app'
import { setupManagerWithEventCycle } from '@tests/factories/setup-event'
import request from 'supertest'

describe('(E2E) - GET /api/v1/institutions/:institutionId/events', () => {
  it('should list institution events including internal cycles', async () => {
    const global = await setupManagerWithEventCycle({ participationScope: 'GLOBAL', name: 'Global' })

    const event = await request(app.server)
      .post(`/api/v1/institutions/${global.institution.id.toString()}/events`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({ participationScope: 'INSTITUTION', name: 'Interno' })

    const response = await request(app.server).get(`/api/v1/institutions/${global.institution.id.toString()}/events`)

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(2)
    expect(response.body.events.map((event: { id: string }) => event.id)).toEqual(
      expect.arrayContaining([global.event.id, event.body.event.id]),
    )
  })

  it('should filter institution events by phase', async () => {
    const { accessToken, institution, event } = await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/events`)
      .query({ phase: 'THEME_SELECTION' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(1)
    expect(response.body.events[0].id).toBe(event.id)
  })

  it('should return 404 when institution does not exist', async () => {
    const response = await request(app.server).get('/api/v1/institutions/00000000-0000-4000-8000-000000000000/events')

    expect(response.status).toBe(404)
  })
})
