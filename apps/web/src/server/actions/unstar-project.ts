'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { unstarProject } from '../http/routes/projects/unstar-project'
import { revalidateProjects } from '../revalidate-projects'

const unstarProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
})

export async function actionUnstarProject(data: FormData) {
  const formResult = unstarProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const [_, responseError] = await unstarProject(projectId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível remover o apoio.' }
  }

  revalidateProjects(projectId)
  revalidatePath('/projetos/apoiados')

  return { success: true, message: 'Apoio removido.' }
}
