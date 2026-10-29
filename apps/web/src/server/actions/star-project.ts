'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { starProject } from '../http/routes/projects/star-project'
import { revalidateProjects } from '../revalidate-projects'

const starProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
})

export async function actionStarProject(data: FormData) {
  const formResult = starProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const [_, responseError] = await starProject(projectId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível apoiar o projeto.' }
  }

  revalidateProjects(projectId)
  revalidatePath('/projetos/apoiados')

  return { success: true, message: 'Projeto apoiado com estrela.' }
}
