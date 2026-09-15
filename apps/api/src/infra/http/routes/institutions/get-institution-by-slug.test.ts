import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

describe('(E2E) - GET /api/v1/institutions/slug/:slug', () => {
  afterAll(async () => await app.close())

  it('should be able to get an institution by slug', async () => {
    const { user } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const response = await request(app.server).get(`/api/v1/institutions/slug/${institution.slug.value}`)

    expect(response.status).toBe(200)
    expect(response.body.institution.id).toBe(institution.id.toString())
  })

  it('should not be able to get an institution when slug does not exist', async () => {
    const response = await request(app.server).get('/api/v1/institutions/slug/slug-inexistente')

    expect(response.status).toBe(404)
  })
})
