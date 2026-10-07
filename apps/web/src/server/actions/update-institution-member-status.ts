'use server'

import z from 'zod'
import { institutionMemberStatusSchema } from '@/utils/type'
import { updateInstitutionMemberStatus } from '../http/routes/institutions/update-institution-member-status'
import { revalidateInstitutionMembers } from '../revalidate-institution-members'

const updateInstitutionMemberStatusSchema = z.object({
  institutionId: z.uuid('Instituição inválida.'),
  institutionSlug: z.string().min(1, 'Slug inválido.'),
  memberId: z.uuid('Membro inválido.'),
  status: institutionMemberStatusSchema,
})

export async function actionUpdateInstitutionMemberStatus(input: {
  institutionId: string
  institutionSlug: string
  memberId: string
  status: z.infer<typeof institutionMemberStatusSchema>
}) {
  const formResult = updateInstitutionMemberStatusSchema.safeParse(input)

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { institutionId, institutionSlug, memberId, status } = formResult.data

  const [_, responseError] = await updateInstitutionMemberStatus({
    institutionId,
    memberId,
    status,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível atualizar o status do membro.',
    }
  }

  revalidateInstitutionMembers(institutionSlug)

  return { success: true, message: 'Status do membro atualizado.' }
}
