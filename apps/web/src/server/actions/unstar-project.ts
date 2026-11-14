'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { unstarProject } from '../http/routes/projects/unstar-project'
import { revalidateProjects } from '../revalidate-projects'

const unstarProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
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
  const projectSlug = formResult.data['project-slug']
  const [_, responseError] = await unstarProject(projectId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível remover o apoio.' }
  }

  revalidateProjects(projectSlug)
  revalidatePath('/me')
  revalidatePath('/me/pontos')

  return { success: true, message: 'Apoio removido.' }
}
