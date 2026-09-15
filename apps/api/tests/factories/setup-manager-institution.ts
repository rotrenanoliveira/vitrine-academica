import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

export async function authenticateUser() {
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

export async function setupManagerWithInstitution() {
  const { accessToken, user } = await authenticateUser()
  const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
  await makeInstitutionMemberOnDatabase({
    institutionId: institution.id.toString(),
    userId: user.id.toString(),
    role: InstitutionMemberRole.MANAGER,
  })

  return { accessToken, user, institution }
}
