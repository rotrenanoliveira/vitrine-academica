import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'

const ONE_HOUR_IN_MS = 60 * 60 * 1000

describe('(E2E) - POST /api/v1/projects/publish-scheduled', () => {
  afterAll(async () => await app.close())

  it('publicar agendados: com agendamento que já venceu, deve retornar 200 com o projeto publicado', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date(Date.now() - ONE_HOUR_IN_MS),
    })

    const response = await request(app.server).post('/api/v1/projects/publish-scheduled')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      projects: [
        {
          id: project.id.toString(),
          title: project.title,
          description: project.description,
          authorId: user.id.toString(),
          status: 'PUBLISHED',
          attachments: [],
          tags: [],
          createdAt: expect.any(String),
        },
      ],
    })

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.PUBLISHED)
  })

  it('publicar agendados: com agendamento para o futuro, deve retornar 200 sem publicar o projeto', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date(Date.now() + 24 * ONE_HOUR_IN_MS),
    })

    const response = await request(app.server).post('/api/v1/projects/publish-scheduled')

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([])

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SCHEDULED)
  })

  it('publicar agendados: com data futura no corpo, deve ignorar a data e não publicar o projeto', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date('2030-06-10T10:00:00.000Z'),
    })

    const response = await request(app.server)
      .post('/api/v1/projects/publish-scheduled')
      .send({ date: '2031-01-01T00:00:00.000Z' })

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([])

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SCHEDULED)
  })
})
