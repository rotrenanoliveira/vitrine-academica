import { appForTest as app } from '@tests/app'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import {
  moderateTheme,
  setupManagerWithEventCycle,
  setupOpenEventCycle,
  suggestTheme,
} from '@tests/factories/setup-event'
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

  it('should return only approved themes to visitors', async () => {
    const { accessToken, event } = await setupManagerWithEventCycle()

    const pending = await suggestTheme({
      accessToken,
      eventId: event.id,
      title: 'Pendente',
    })
    const approved = await suggestTheme({
      accessToken,
      eventId: event.id,
      title: 'Aprovado',
    })

    expect(pending.status).toBe(201)
    expect(approved.status).toBe(201)

    const moderation = await moderateTheme({
      accessToken,
      themeId: approved.body.theme.id,
      action: 'APPROVE',
    })
    expect(moderation.status).toBe(200)

    const visitor = await request(app.server).get(`/api/v1/events/${event.id}/theme-selection`)
    const manager = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(visitor.status).toBe(200)
    expect(visitor.body.themes).toHaveLength(1)
    expect(visitor.body.themes[0].title).toBe('Aprovado')
    expect(visitor.body.themes[0].status).toBe('APPROVED')

    expect(manager.status).toBe(200)
    expect(manager.body.themes).toHaveLength(2)
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

  it('should allow non-eligible users to read institution theme selection', async () => {
    const { event } = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.themes).toEqual([])
  })

  it('should return approved themes of a listed event to non-managers', async () => {
    const { event, theme } = await setupOpenEventCycle({ participationScope: 'GLOBAL' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/events/${event.id}/theme-selection`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.themes).toEqual([expect.objectContaining({ id: theme.id, status: 'APPROVED' })])
  })
})
