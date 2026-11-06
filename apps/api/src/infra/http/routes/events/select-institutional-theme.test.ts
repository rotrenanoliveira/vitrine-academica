import { appForTest as app } from '@tests/app'
import { moderateTheme, setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - POST /api/v1/events/:eventId/select-theme', () => {
  it('should be able to select an approved theme early', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id, title: 'Tema vencedor' })
    await moderateTheme({ accessToken, themeId: themeResponse.body.theme.id, action: 'APPROVE' })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/select-theme`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    expect(response.status).toBe(200)
    expect(response.body.event.phase).toBe('OPEN')
    expect(response.body.event.winnerThemeId).toBe(themeResponse.body.theme.id)
  })

  it('should not be able to select a pending theme', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/select-theme`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    expect(response.status).toBe(404)
  })

  it('should not be able to select theme when not allowed', async () => {
    const { accessToken: managerToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken: managerToken, eventId: event.id })
    await moderateTheme({ accessToken: managerToken, themeId: themeResponse.body.theme.id, action: 'APPROVE' })

    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/select-theme`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    expect(response.status).toBe(403)
  })

  it('should not be able to select theme twice', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id })
    await moderateTheme({ accessToken, themeId: themeResponse.body.theme.id, action: 'APPROVE' })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/select-theme`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/select-theme`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    expect(response.status).toBe(409)
  })
})
