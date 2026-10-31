import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

describe('(E2E) - GET /api/v1/projects/scheduled/soon', () => {
  afterAll(async () => await app.close())

  it('listar em breve: sem projetos agendados, deve retornar 200 com lista vazia', async () => {
    const response = await request(app.server).get('/api/v1/projects/scheduled/soon')

    expect(response.status).toBe(200)
    expect(response.body.scheduledProjects).toEqual([])
  })

  it('listar em breve: com projetos na janela de 7 dias, deve retornar 200 ordenados por data', async () => {
    const { user } = await makeUserOnDatabase()

    const scheduleOnDatabase = async (publishedIn: Date) => {
      const { project } = await makeProjectOnDatabase({
        author: user.id,
        status: ProjectStatus.SCHEDULED,
      })
      await makeProjectScheduledOnDatabase({ projectId: project.id, publishedIn })

      return project
    }

    const inThreeDays = await scheduleOnDatabase(daysFromNow(3))
    const tomorrow = await scheduleOnDatabase(daysFromNow(1))
    await scheduleOnDatabase(daysFromNow(10))
    await scheduleOnDatabase(daysFromNow(-1))

    const response = await request(app.server).get('/api/v1/projects/scheduled/soon')

    expect(response.status).toBe(200)

    const ids = response.body.scheduledProjects.map((item: { project: { id: string } }) => item.project.id)

    expect(ids).toEqual([tomorrow.id.toString(), inThreeDays.id.toString()])
  })
})