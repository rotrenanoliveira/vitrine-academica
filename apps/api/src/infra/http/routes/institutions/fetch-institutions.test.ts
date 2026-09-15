import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

describe('(E2E) - GET /api/v1/institutions', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch institutions when the list is empty', async () => {
    const response = await request(app.server).get('/api/v1/institutions')

    expect(response.status).toBe(200)
    expect(response.body.institutions).toEqual([])
  })

  it('should be able to fetch institutions', async () => {
    const { user } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const response = await request(app.server).get('/api/v1/institutions')

    expect(response.status).toBe(200)
    expect(response.body.institutions).toHaveLength(1)
    expect(response.body.institutions[0]).toEqual({
      id: institution.id.toString(),
      name: institution.name,
      slug: institution.slug.value,
      type: institution.type,
      status: institution.status,
      origin: institution.origin,
      description: institution.description,
      registerBy: institution.registerBy.toString(),
      shouldProof: institution.shouldProof,
      shouldVerify: institution.shouldVerify,
      domain: institution.domain ?? null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })
})
