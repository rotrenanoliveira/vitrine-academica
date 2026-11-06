import { appForTest as app } from '@tests/app'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { setupManagerWithEventCycle } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - POST /api/v1/events/:eventId/themes', () => {
  it('should be able to suggest a theme on a global event', async () => {
    const { accessToken, event, user } = await setupManagerWithEventCycle({
      participationScope: 'GLOBAL',
    })

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/themes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Sustentabilidade urbana',
        description: 'Projetos voltados à cidade sustentável',
      })

    expect(response.status).toBe(201)
    expect(response.body.theme.eventId).toBe(event.id)
    expect(response.body.theme.authorId).toBe(user.id.toString())
    expect(response.body.theme.title).toBe('Sustentabilidade urbana')
    expect(response.body.theme.status).toBe('PENDING')
  })

  it('should not be able to suggest a theme on an institution event without membership', async () => {
    const { event } = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION' })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/events/${event.id}/themes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Tema',
        description: 'Descrição',
      })

    expect(response.status).toBe(403)
  })

  it('should be able to suggest a theme on an institution event as member', async () => {
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
      .post(`/api/v1/events/${event.id}/themes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Tema interno',
        description: 'Descrição interna',
      })

    expect(response.status).toBe(201)
    expect(response.body.theme.authorId).toBe(user.id.toString())
  })

  it('should not be able to suggest a theme for a non-existent event', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/events/invalid-event-id/themes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Tema',
        description: 'Descrição',
      })

    expect(response.status).toBe(404)
  })
})
