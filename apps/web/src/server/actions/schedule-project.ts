'use server'

import z from 'zod'
import { scheduleProject } from '../http/routes/projects/schedule-project'
import { revalidateProjects } from '../revalidate-projects'

const scheduleProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
  'published-in': z.string().min(1, 'Informe a data de publicação.'),
})

export async function actionScheduleProject(data: FormData) {
  const formResult = scheduleProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const projectSlug = formResult.data['project-slug']
  const publishedInDate = new Date(formResult.data['published-in'])

  if (Number.isNaN(publishedInDate.getTime())) {
    return { success: false, message: 'Informe uma data de publicação válida.' }
  }

  const publishedIn = publishedInDate.toISOString()

  const [_, responseError] = await scheduleProject({
    projectId,
    publishedIn,
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível agendar o projeto.' }
  }

  revalidateProjects(projectSlug)

  return { success: true, message: 'Projeto agendado para publicação.' }
}
