import { appForTest as app } from '@tests/app'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import request from 'supertest'

describe('(E2E) - GET /api/v1/rating-criteria', () => {
  afterAll(async () => await app.close())

  it('should able to get active rating criteria', async () => {
    await makeRatingCriterionOnDatabase({ name: 'Critério ativo', active: true })
    await makeRatingCriterionOnDatabase({ name: 'Critério inativo', active: false })

    const response = await request(app.server).get('/api/v1/rating-criteria')

    expect(response.status).toBe(200)
    expect(response.body.criteria.length).toBeGreaterThanOrEqual(1)
    expect(response.body.criteria.every((criterion: { active: boolean }) => criterion.active)).toBe(true)
  })
})
