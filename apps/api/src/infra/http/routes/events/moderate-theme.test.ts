import { randomUUID } from 'node:crypto'
import { appForTest as app } from '@tests/app'
import { setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - PATCH /api/v1/events/themes/:themeId/moderation', () => {
  it('should be able to approve a theme', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({
      accessToken,
      eventId: event.id,
      title: 'Tema para aprovar',
    })

    const response = await request(app.server)
      .patch(`/api/v1/events/themes/${themeResponse.body.theme.id}/moderation`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(200)
    expect(response.body.theme.status).toBe('APPROVED')
    expect(response.body.theme.moderatedByUserId).toBeTruthy()
  })

  it('should be able to reject a theme', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id })

    const response = await request(app.server)
      .patch(`/api/v1/events/themes/${themeResponse.body.theme.id}/moderation`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'REJECT', reason: 'Fora do escopo' })

    expect(response.status).toBe(200)
    expect(response.body.theme.status).toBe('REJECTED')
    expect(response.body.theme.moderationReason).toBe('Fora do escopo')
  })

  it('should not be able to moderate a theme when not allowed', async () => {
    const { accessToken: managerToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({
      accessToken: managerToken,
      eventId: event.id,
    })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .patch(`/api/v1/events/themes/${themeResponse.body.theme.id}/moderation`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(403)
  })

  it('should not be able to moderate a non-existent theme', async () => {
    const { accessToken } = await setupManagerWithEventCycle()
    const invalidThemeId = randomUUID()

    const response = await request(app.server)
      .patch(`/api/v1/events/themes/${invalidThemeId}/moderation`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ action: 'APPROVE' })

    expect(response.status).toBe(404)
  })
})
