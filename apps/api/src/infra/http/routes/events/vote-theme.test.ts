import { randomUUID } from 'node:crypto'
import { appForTest as app } from '@tests/app'
import { moderateTheme, setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - POST /api/v1/events/:eventId/votes', () => {
  it('should be able to vote on an approved theme', async () => {
    const { accessToken, event, user } = await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })
    const themeResponse = await suggestTheme({ accessToken: accessToken, eventId: event.id })
    await moderateTheme({ accessToken: accessToken, themeId: themeResponse.body.theme.id, action: 'APPROVE' })
    const themeId = themeResponse.body.theme.id

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId })

    expect(response.status).toBe(201)
    expect(response.body.vote.eventId).toBe(event.id)
    expect(response.body.vote.themeId).toBe(themeId)
    expect(response.body.vote.userId).toBe(user.id.toString())
  })

  it('should not be able to vote twice on the same event', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })
    const themeResponse = await suggestTheme({ accessToken: accessToken, eventId: event.id })
    await moderateTheme({ accessToken: accessToken, themeId: themeResponse.body.theme.id, action: 'APPROVE' })
    const themeId = themeResponse.body.theme.id

    await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId })

    expect(response.status).toBe(409)
  })

  it('should not be able to vote on a pending theme', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    expect(response.status).toBe(404)
  })

  it('should not be able to vote on a non-existent event', async () => {
    const { accessToken } = await authenticateUser()
    const invalidId = randomUUID()

    const response = await request(app.server)
      .post(`/api/v1/events/${invalidId}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: invalidId })

    expect(response.status).toBe(404)
  })
})
