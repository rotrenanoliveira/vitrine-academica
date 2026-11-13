'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { promoteProject } from '../http/routes/points/promote-project'
import { revalidateProjects } from '../revalidate-projects'

const promoteProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
})

export async function actionPromoteProject(data: FormData) {
  const formResult = promoteProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const projectSlug = formResult.data['project-slug']
  const [_, responseError] = await promoteProject(projectId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível promover o projeto.' }
  }

  revalidateProjects(projectSlug)
  revalidatePath('/')
  revalidatePath('/projetos/promovidos')
  revalidatePath('/conta')

  return { success: true, message: 'Projeto promovido com sucesso.' }
}
