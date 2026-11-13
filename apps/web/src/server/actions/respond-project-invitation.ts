'use server'

import z from 'zod'
import { respondProjectInvitation } from '../http/routes/projects/respond-project-invitation'
import { revalidateProjectMembers } from '../revalidate-project-members'

const respondProjectInvitationSchema = z.object({
  'invitation-id': z.uuid('Convite inválido.'),
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
  status: z.enum(['ACCEPTED', 'REJECTED'], 'Resposta inválida.'),
})

export async function actionRespondProjectInvitation(data: FormData) {
  const formResult = respondProjectInvitationSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const invitationId = formResult.data['invitation-id']
  const projectSlug = formResult.data['project-slug']
  const status = formResult.data.status

  const [_, responseError] = await respondProjectInvitation({ invitationId, status })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível responder ao convite.' }
  }

  revalidateProjectMembers(projectSlug)

  return { success: true, message: status === 'ACCEPTED' ? 'Convite aceito.' : 'Convite recusado.' }
}
