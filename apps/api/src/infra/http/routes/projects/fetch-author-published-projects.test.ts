import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

describe('(E2E) - GET /api/v1/authors/:authorId/projects', () => {
  afterAll(async () => await app.close())

  it('deve retornar o nome do autor e os projetos publicados do mais recente para o mais antigo', async () => {
    const { user: author } = await makeUserOnDatabase({ name: 'Maria Autora' })

    const { project: older } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2024-01-10'),
    })
    const { project: newer } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2024-08-10'),
    })
    await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server).get(`/api/v1/authors/${author.id.toString()}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.author).toEqual({
      id: author.id.toString(),
      name: 'Maria Autora',
    })
    expect(response.body.projects).toHaveLength(2)
    expect(response.body.projects.map((project: { id: string }) => project.id)).toEqual([
      newer.id.toString(),
      older.id.toString(),
    ])
  })

  it('deve retornar lista vazia quando o autor nao tem projetos publicados', async () => {
    const { user: author } = await makeUserOnDatabase({ name: 'Autor Sem Publicacao' })

    await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server).get(`/api/v1/authors/${author.id.toString()}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.author.name).toBe('Autor Sem Publicacao')
    expect(response.body.projects).toEqual([])
  })

  it('deve retornar 404 quando o autor nao existe', async () => {
    const response = await request(app.server).get(`/api/v1/authors/${new UniqueEntityId().toString()}/projects`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
