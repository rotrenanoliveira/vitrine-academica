import { appForTest as app } from '@tests/app'
import { authenticateAs } from '@tests/factories/authenticate-as'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import request from 'supertest'
import { UserRole } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/analytics/projects', () => {
  afterAll(async () => await app.close())

  it('deve retornar os indicadores de projetos para um administrador', async () => {
    const { accessToken, user } = await authenticateAs(app, UserRole.ADMIN)
    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })
    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })
    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await request(app.server)
      .get('/api/v1/analytics/projects?days=7')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(3)
    expect(response.body.createdInPeriod).toBe(3)
    expect(response.body.byStatus).toEqual(
      expect.arrayContaining([
        { label: 'PUBLISHED', total: 2 },
        { label: 'SKETCH', total: 1 },
      ]),
    )
    expect(response.body.createdByDay).toHaveLength(7)
  })

  it('não deve permitir acesso a quem não é administrador', async () => {
    const { accessToken } = await authenticateAs(app, UserRole.STUDENT)

    const response = await request(app.server)
      .get('/api/v1/analytics/projects')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('não deve permitir acesso sem token', async () => {
    const response = await request(app.server).get('/api/v1/analytics/projects')

    expect(response.status).toBe(401)
  })
})
