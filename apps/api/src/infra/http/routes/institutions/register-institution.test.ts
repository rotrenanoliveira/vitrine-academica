import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionType } from '@/domain/institution/enterprise/entities/institutions'

describe('(E2E) - POST /api/v1/institutions', () => {
  afterAll(async () => await app.close())

  it('should be able to register an institution', async () => {
    const { accessToken, user } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Universidade Teste',
        type: InstitutionType.UNIVERSITY,
        description: 'Descrição da universidade',
      })

    expect(response.status).toBe(201)
    expect(response.body.institution).toEqual({
      id: expect.any(String),
      name: 'Universidade Teste',
      slug: 'universidade-teste',
      type: 'UNIVERSITY',
      status: 'ACTIVE',
      origin: 'USER_REGISTRATION',
      description: 'Descrição da universidade',
      registerBy: user.id.toString(),
      shouldProof: false,
      shouldVerify: false,
      domain: null,
      createdAt: expect.any(String),
      updatedAt: null,
    })
    expect(response.body.member).toEqual({
      id: expect.any(String),
      institutionId: response.body.institution.id,
      userId: user.id.toString(),
      role: 'MANAGER',
      status: 'ACTIVE',
      createdAt: expect.any(String),
      updatedAt: null,
    })
  })

  it('should not be able to register an institution with a duplicate slug', async () => {
    const { user } = await makeUserOnDatabase()
    await makeInstitutionOnDatabase({ name: 'Universidade Duplicada', registerBy: user.id })

    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Universidade Duplicada',
        type: InstitutionType.UNIVERSITY,
        description: 'Descrição',
      })

    expect(response.status).toBe(409)
  })

  it('should not be able to register an institution without a token', async () => {
    const response = await request(app.server).post('/api/v1/institutions').send({
      name: 'Universidade',
      type: InstitutionType.UNIVERSITY,
      description: 'Descrição',
    })

    expect(response.status).toBe(401)
  })
})
