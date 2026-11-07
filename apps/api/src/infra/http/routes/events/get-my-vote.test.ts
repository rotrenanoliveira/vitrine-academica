import { appForTest as app } from '@tests/app'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { moderateTheme, setupManagerWithEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/events/:eventId/votes/me', () => {
  it('should return null when the user has not voted yet', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle({
      participationScope: 'GLOBAL',
    })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/votes/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.vote).toBeNull()
  })

  it('should return the current user vote', async () => {
    const { accessToken, event, user } = await setupManagerWithEventCycle({
      participationScope: 'GLOBAL',
    })
    const themeResponse = await suggestTheme({ accessToken, eventId: event.id })
    await moderateTheme({
      accessToken,
      themeId: themeResponse.body.theme.id,
      action: 'APPROVE',
    })

    await request(app.server)
      .post(`/api/v1/events/${event.id}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeId: themeResponse.body.theme.id })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/votes/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.vote.themeId).toBe(themeResponse.body.theme.id)
    expect(response.body.vote.userId).toBe(user.id.toString())
  })

  it('should not return vote when user is not eligible for institution event', async () => {
    const { event } = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/votes/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('should allow eligible institution member to consult vote', async () => {
    const { event, institution } = await setupManagerWithEventCycle({
      participationScope: 'INSTITUTION',
    })
    const { accessToken, user } = await authenticateUser()
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/votes/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.vote).toBeNull()
  })
})
