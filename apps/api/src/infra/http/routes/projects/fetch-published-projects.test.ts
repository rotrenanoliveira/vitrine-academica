import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/projects/published', () => {
  afterAll(async () => await app.close())

  it('deve ser possivel buscar todos os projetos publicados', async () => {
    const { user } = await makeUserOnDatabase()
    const { project: published } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })
    await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server).get('/api/v1/projects/published')

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual(
      expect.arrayContaining([
        {
          id: published.id.toString(),
          title: published.title,
          description: published.description,
          authorId: user.id.toString(),
          status: 'PUBLISHED',
          attachments: [],
          tags: [],
          createdAt: expect.any(String),
        },
      ]),
    )
    expect(response.body.projects.every((project: { status: string }) => project.status === 'PUBLISHED')).toBe(true)
  })
})
