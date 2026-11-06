import { appForTest as app } from '@tests/app'
import { moderateTheme, setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import request from 'supertest'

describe('(E2E) - GET /api/v1/events/:eventId/themes', () => {
  it('should list only approved themes', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()

    const approved = await suggestTheme({ accessToken, eventId: event.id, title: 'Aprovado' })
    const pending = await suggestTheme({ accessToken, eventId: event.id, title: 'Pendente' })
    const rejected = await suggestTheme({ accessToken, eventId: event.id, title: 'Rejeitado' })

    await moderateTheme({ accessToken, themeId: approved.body.theme.id, action: 'APPROVE' })
    await moderateTheme({ accessToken, themeId: rejected.body.theme.id, action: 'REJECT', reason: 'Fora do escopo' })

    const response = await request(app.server).get(`/api/v1/events/${event.id}/themes`)

    expect(response.status).toBe(200)
    expect(response.body.themes).toHaveLength(1)
    expect(response.body.themes[0].id).toBe(approved.body.theme.id)
    expect(response.body.themes[0].status).toBe('APPROVED')
    expect(response.body.themes.map((theme: { id: string }) => theme.id)).not.toContain(pending.body.theme.id)
  })

  it('should return 404 for a non-existent event', async () => {
    const response = await request(app.server).get('/api/v1/events/invalid-event-id/themes')

    expect(response.status).toBe(404)
  })
})
