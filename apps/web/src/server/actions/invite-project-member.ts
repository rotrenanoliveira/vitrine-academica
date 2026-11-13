'use server'

import z from 'zod'
import { inviteProjectMember } from '../http/routes/projects/invite-project-member'
import { revalidateProjectMembers } from '../revalidate-project-members'

const inviteProjectMemberSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
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
  const projectSlug = formResult.data['project-slug']
  const email = formResult.data.email

  const [_, responseError] = await inviteProjectMember({ projectId, email })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível enviar o convite.' }
  }

  revalidateProjectMembers(projectSlug)

  return { success: true, message: 'Convite enviado.' }
}
