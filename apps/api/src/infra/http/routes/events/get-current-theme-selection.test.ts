import { appForTest as app } from '@tests/app'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { setupManagerWithEventCycle, setupOpenEventCycle, suggestTheme } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/events/:eventId/theme-selection', () => {
  it('should return event and themes', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle({
      name: 'Ciclo atual',
    })

    await suggestTheme({
      accessToken,
      eventId: event.id,
      title: 'Tema 1',
    })

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.themes).toHaveLength(1)
    expect(response.body.themes[0].title).toBe('Tema 1')
  })

  it('should allow eligible participants to consult theme selection', async () => {
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
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
  })

  it('should not allow non-eligible users on institution events', async () => {
    const { event } = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('should hide theme selection from non-managers', async () => {
    const { event } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })
})
