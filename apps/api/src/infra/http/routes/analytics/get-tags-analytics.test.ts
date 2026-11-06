import { appForTest as app } from '@tests/app'
import { authenticateAs } from '@tests/factories/authenticate-as'
import request from 'supertest'
import { UserRole } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - GET /api/v1/analytics/tags', () => {
  afterAll(async () => await app.close())

  it('deve retornar uma lista vazia quando nenhuma tag foi usada', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.ADMIN)

    const response = await request(app.server)
      .get('/api/v1/analytics/tags?limit=5')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ tags: [] })
  })

  it('não deve permitir acesso a quem não é administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.STUDENT)

    const response = await request(app.server)
      .get('/api/v1/analytics/tags')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('não deve permitir acesso sem token', async () => {
    const response = await request(app.server).get('/api/v1/analytics/tags')

    expect(response.status).toBe(401)
  })
})
