import { appForTest as app } from '@tests/app'
import { setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) Create Event Cycle', () => {
  it('should be able to create a event', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/events`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        participationScope: 'GLOBAL',
        name: 'Ciclo de Inovação',
      })

    expect(response.status).toBe(201)
    expect(response.body.event.phase).toBe('THEME_SELECTION')
    expect(response.body.event.participationScope).toBe('GLOBAL')
    expect(response.body.event.institutionId).toBe(institution.id.toString())
    expect(response.body.event.name).toBe('Ciclo de Inovação')
  })
})
