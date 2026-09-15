'use server'

import z from 'zod'
import { editInstitution } from '../http/routes/institutions/edit-institution'
import { revalidateInstitutions } from '../revalidate-institutions'

const editInstitutionSchema = z.object({
  'institution-id': z.uuid('Instituição inválida.'),
  'institution-slug': z.string().min(1, 'Slug inválido.'),
  name: z.string().min(1, 'Informe o nome.').max(200),
  description: z.string().min(1, 'Informe a descrição.'),
  'should-proof': z.string().optional(),
  'should-verify': z.string().optional(),
  domain: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
})

export async function actionEditInstitution(data: FormData) {
  const formResult = editInstitutionSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const id = formResult.data['institution-id']
  const slug = formResult.data['institution-slug']
  const [_, responseError] = await editInstitution({
    id,
    name: formResult.data.name,
    description: formResult.data.description,
    domain: formResult.data.domain,
    shouldProof: formResult.data['should-proof'] === 'on',
    shouldVerify: formResult.data['should-verify'] === 'on',
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível atualizar a instituição.',
    }
  }

  revalidateInstitutions(slug)

  return { success: true, message: 'Instituição atualizada.' }
}
