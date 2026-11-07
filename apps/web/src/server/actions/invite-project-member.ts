'use server'

import z from 'zod'
import { inviteProjectMember } from '../http/routes/projects/invite-project-member'
import { revalidateProjectMembers } from '../revalidate-project-members'

const inviteProjectMemberSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  email: z.email('Informe um e-mail válido.'),
})

export async function actionInviteProjectMember(data: FormData) {
  const formResult = inviteProjectMemberSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const email = formResult.data.email

  const [_, responseError] = await inviteProjectMember({ projectId, email })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível enviar o convite.' }
  }

  revalidateProjectMembers(projectId)

  return { success: true, message: 'Convite enviado.' }
}
