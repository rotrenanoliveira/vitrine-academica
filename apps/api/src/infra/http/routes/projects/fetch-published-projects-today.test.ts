import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/projects/published/today', () => {
  afterAll(async () => await app.close())

  it('deve ser possivel buscar os projetos publicados com agendamento no dia atual', async () => {
    const { user } = await makeUserOnDatabase()
    const today = new Date()
    const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1, 12))

    await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: today,
    })

    const { project: scheduledPublished } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: yesterday,
    })
    await makeProjectScheduledOnDatabase({
      projectId: scheduledPublished.id,
      publishedIn: today,
    })

    const { project: scheduledAnotherDay } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: yesterday,
    })
    await makeProjectScheduledOnDatabase({
      projectId: scheduledAnotherDay.id,
      publishedIn: yesterday,
    })

    const response = await request(app.server).get('/api/v1/projects/published/today')

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([
      expect.objectContaining({
        id: scheduledPublished.id.toString(),
        status: 'PUBLISHED',
      }),
    ])
  })
})
