import { appForTest as app } from '@tests/app'
import { authenticateAs } from '@tests/factories/authenticate-as'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserRole } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - GET /api/v1/analytics/users', () => {
  afterAll(async () => await app.close())

  it('deve retornar os indicadores de usuários para um administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.ADMIN)
    await makeUserOnDatabase()
    await makeUserOnDatabase()

    const response = await request(app.server)
      .get('/api/v1/analytics/users?days=30')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(3)
    expect(response.body.createdInPeriod).toBe(3)
    expect(response.body.byStatus).toEqual(
      expect.arrayContaining([
        { label: 'ACTIVE', total: 1 },
        { label: 'PENDING', total: 2 },
      ]),
    )
    expect(response.body.createdByDay).toHaveLength(30)
  })

  it('não deve permitir acesso a quem não é administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.PROFESSOR)

    const response = await request(app.server)
      .get('/api/v1/analytics/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('não deve permitir acesso sem token', async () => {
    const response = await request(app.server).get('/api/v1/analytics/users')

    expect(response.status).toBe(401)
  })
})
