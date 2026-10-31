'use server'

import z from 'zod'
import { publishProject } from '../http/routes/projects/publish-project'
import { revalidateProjects } from '../revalidate-projects'

const publishProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
})

export async function actionPublishProject(data: FormData) {
  const formResult = publishProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']

  const [_, responseError] = await publishProject({ projectId })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível publicar o projeto.' }
  }

  revalidateProjects(projectId)

  return { success: true, message: 'Projeto publicado.' }
}
