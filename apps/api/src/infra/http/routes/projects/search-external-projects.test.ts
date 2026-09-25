import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { vi } from 'vitest'
import { OpenAlexService } from '@/infra/external/openalex.service'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

describe('(E2E) - GET /api/v1/projects/external-search', () => {
  const searchSpy = vi.spyOn(OpenAlexService.prototype, 'search')

  beforeEach(() => {
    searchSpy.mockReset()
  })

  afterAll(async () => await app.close())

  it('deve retornar 401 sem token', async () => {
    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: 'Engenharia de Software' })

    expect(response.status).toBe(401)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('deve retornar 400 quando q não é informado', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(400)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('deve retornar 400 quando q tem menos de 3 caracteres', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: 'ab' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(400)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('deve retornar 400 quando q tem apenas espaços', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: '     ' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(400)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('deve retornar 200 com os projetos encontrados', async () => {
    const { accessToken } = await authenticateUser()

    searchSpy.mockResolvedValue([
      {
        title: 'PFC Teste',
        authors: ['Thainá Soares'],
        externalUrl: 'https://pfc.1234/test',
        publishedIn: 'PFC UMC',
        abstract: 'Resumo de teste.',
      },
    ])

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: 'Engenharia de Software' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].title).toBe('PFC Teste')
    expect(searchSpy).toHaveBeenCalledWith('Engenharia de Software')
  })

  it('deve retornar 200 com lista vazia quando nada é encontrado', async () => {
    const { accessToken } = await authenticateUser()

    searchSpy.mockResolvedValue([])

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: 'query-sem-resultados' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([])
  })

  it('deve retornar 502 quando o serviço externo falha', async () => {
    const { accessToken } = await authenticateUser()

    searchSpy.mockRejectedValue(new Error('OpenAlex unavailable'))

    const response = await request(app.server)
      .get('/api/v1/projects/external-search')
      .query({ q: 'software engineering' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(502)
    expect(response.body.message).toBe('Erro ao buscar projetos externos')
  })
})
