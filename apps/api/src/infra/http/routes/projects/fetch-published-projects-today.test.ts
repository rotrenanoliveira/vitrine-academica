import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'

const HOUR_IN_MS = 60 * 60 * 1000

describe('(E2E) - GET /api/v1/projects/published/today', () => {
  afterAll(async () => await app.close())

  it('listar hoje: com projetos lançados hoje, deve retornar 200 com os projetos', async () => {
    const { user } = await makeUserOnDatabase()
    const now = new Date()

    const { project: launchedToday } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })
    await makeProjectScheduledOnDatabase({ projectId: launchedToday.id, publishedIn: now })

    const { project: launchedBefore } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })
    await makeProjectScheduledOnDatabase({
      projectId: launchedBefore.id,
      publishedIn: new Date(now.getTime() - 36 * HOUR_IN_MS),
    })

    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server).get('/api/v1/projects/published/today')

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([
      expect.objectContaining({
        id: launchedToday.id.toString(),
        status: 'PUBLISHED',
      }),
    ])
  })

  it('listar hoje: com projeto agendado para hoje, deve retornar 200 sem publicar o projeto', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({ projectId: project.id, publishedIn: new Date() })

    const response = await request(app.server).get('/api/v1/projects/published/today')

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([])

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SCHEDULED)
  })
})
