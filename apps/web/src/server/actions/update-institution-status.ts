'use server'

import z from 'zod'
import { institutionStatusSchema } from '@/utils/type'
import { updateInstitutionStatus } from '../http/routes/institutions/update-institution-status'
import { revalidateInstitutions } from '../revalidate-institutions'

const updateInstitutionStatusSchema = z.object({
  institutionId: z.uuid('Instituição inválida.'),
  institutionSlug: z.string().min(1, 'Slug inválido.'),
  status: institutionStatusSchema,
})

export async function actionUpdateInstitutionStatus(input: {
  institutionId: string
  institutionSlug: string
  status: z.infer<typeof institutionStatusSchema>
}) {
  const formResult = updateInstitutionStatusSchema.safeParse(input)

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { institutionId, institutionSlug, status } = formResult.data

  const [_, responseError] = await updateInstitutionStatus({
    id: institutionId,
    status,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível atualizar o status.',
    }
  }

  revalidateInstitutions(institutionSlug)

  return { success: true, message: 'Status atualizado.' }
}
