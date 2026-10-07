import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - PUT /api/v1/institutions/:institutionId', () => {
  afterAll(async () => await app.close())

  it('should be able to edit an institution as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .put(`/api/v1/institutions/${institution.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Nome Atualizado',
        description: 'Descrição atualizada',
      })

    expect(response.status).toBe(200)
    expect(response.body.institution.name).toBe('Nome Atualizado')
    expect(response.body.institution.description).toBe('Descrição atualizada')
  })

  it('should not be able to edit an institution when not a manager', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .put(`/api/v1/institutions/${institution.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Hack',
        description: 'Hack',
      })

    expect(response.status).toBe(403)
  })

  it('should not be able to edit an institution that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .put('/api/v1/institutions/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Nome',
        description: 'Descrição',
      })

    expect(response.status).toBe(404)
  })
})
