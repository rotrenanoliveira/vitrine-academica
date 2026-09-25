'use server'

import z from 'zod'
import { institutionMemberRoleSchema } from '@/utils/type'
import { updateInstitutionMemberRole } from '../http/routes/institutions/update-institution-member-role'
import { revalidateInstitutionMembers } from '../revalidate-institution-members'

const updateInstitutionMemberRoleSchema = z.object({
  institutionId: z.uuid('Instituição inválida.'),
  institutionSlug: z.string().min(1, 'Slug inválido.'),
  memberId: z.uuid('Membro inválido.'),
  role: institutionMemberRoleSchema,
})

export async function actionUpdateInstitutionMemberRole(input: {
  institutionId: string
  institutionSlug: string
  memberId: string
  role: z.infer<typeof institutionMemberRoleSchema>
}) {
  const formResult = updateInstitutionMemberRoleSchema.safeParse(input)

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { institutionId, institutionSlug, memberId, role } = formResult.data

  const [_, responseError] = await updateInstitutionMemberRole({
    institutionId,
    memberId,
    role,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível atualizar o cargo do membro.',
    }
  }

  revalidateInstitutionMembers(institutionSlug)

  return { success: true, message: 'Cargo do membro atualizado.' }
}
