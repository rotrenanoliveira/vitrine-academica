'use server'

import z from 'zod'
import { institutionTypeSchema } from '@/utils/type'
import { registerInstitution } from '../http/routes/institutions/register-institution'
import { revalidateInstitutions } from '../revalidate-institutions'

const registerInstitutionSchema = z.object({
  name: z.string().min(1, 'Informe o nome.').max(200),
  type: institutionTypeSchema,
  description: z.string().min(1, 'Informe a descrição.'),
  'should-proof': z.string().optional(),
  'should-verify': z.string().optional(),
  domain: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
})

export async function actionRegisterInstitution(data: FormData) {
  const formResult = registerInstitutionSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { name, type, description, domain, ...flags } = formResult.data

  const [_, responseError] = await registerInstitution({
    name,
    type,
    description,
    domain,
    shouldProof: flags['should-proof'] === 'on',
    shouldVerify: flags['should-verify'] === 'on',
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível criar a instituição.',
    }
  }

  revalidateInstitutions()

  return { success: true, message: 'Instituição criada.' }
}
