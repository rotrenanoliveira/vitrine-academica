import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - POST /api/v1/projects/publish-scheduled', () => {
  afterAll(async () => await app.close())

  it('deve ser possivel publicar projetos agendados', async () => {
    // Esta rota sera usada internamente pelo sistema para publicar projetos agendados para a data informada
    const { user } = await makeUserOnDatabase()
    const publishedIn = new Date('2030-06-10T10:00:00.000Z')
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SCHEDULED,
    })

    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn,
    })

    const response = await request(app.server).post('/api/v1/projects/publish-scheduled').send({
      date: publishedIn.toISOString(),
    })

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
  })
})
