import { appForTest as app } from '@tests/app'
import { moderateTheme, setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - GET /api/v1/events/:eventId/vote-counter', () => {
  it('should return vote counter', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })
    const firstTheme = await suggestTheme({ accessToken, eventId: event.id, title: 'Tema A' })
    const secondTheme = await suggestTheme({ accessToken, eventId: event.id, title: 'Tema B' })

    await moderateTheme({ accessToken, themeId: firstTheme.body.theme.id, action: 'APPROVE' })
    await moderateTheme({ accessToken, themeId: secondTheme.body.theme.id, action: 'APPROVE' })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: firstTheme.body.theme.id })

    const voter = await authenticateUser()

    await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${voter.accessToken}`)
      .send({ themeId: firstTheme.body.theme.id })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/vote-counter`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.counter).toEqual(expect.arrayContaining([{ themeId: firstTheme.body.theme.id, votes: 2 }]))
  })

  it('should not allow non-managers to consult counter', async () => {
    const { event } = await setupManagerWithEventCycle()
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/vote-counter`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('should return 404 for a non-existent event', async () => {
    const { accessToken } = await setupManagerWithEventCycle()

    const response = await request(app.server)
      .get('/api/v1/events/invalid-theme-id/vote-counter')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })
})
