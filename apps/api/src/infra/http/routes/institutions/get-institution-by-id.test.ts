import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

describe('(E2E) - GET /api/v1/institutions/:institutionId', () => {
  afterAll(async () => await app.close())

  it('should be able to get an institution by id', async () => {
    const { user } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const response = await request(app.server).get(`/api/v1/institutions/${institution.id.toString()}`)

    expect(response.status).toBe(200)
    expect(response.body.institution.id).toBe(institution.id.toString())
  })

  it('should not be able to get an institution when it does not exist', async () => {
    const response = await request(app.server).get('/api/v1/institutions/00000000-0000-4000-8000-000000000000')

    expect(response.status).toBe(404)
  })
})
