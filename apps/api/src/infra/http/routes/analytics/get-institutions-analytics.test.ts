import { appForTest as app } from '@tests/app'
import { authenticateAs } from '@tests/factories/authenticate-as'
import request from 'supertest'
import { UserRole } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - GET /api/v1/analytics/institutions', () => {
  afterAll(async () => await app.close())

  it('deve retornar os indicadores de instituições para um administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.ADMIN)

    const response = await request(app.server)
      .get('/api/v1/analytics/institutions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(0)
    expect(response.body.pendingMembershipRequests).toBe(0)
    expect(response.body.byStatus).toHaveLength(4)
    expect(response.body.membersByRole).toEqual(expect.any(Array))
  })

  it('não deve permitir acesso a quem não é administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.USER)

    const response = await request(app.server)
      .get('/api/v1/analytics/institutions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('não deve permitir acesso sem token', async () => {
    const response = await request(app.server).get('/api/v1/analytics/institutions')

    expect(response.status).toBe(401)
  })
})
