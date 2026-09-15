'use server'

import z from 'zod'
import { scheduleProject } from '../http/routes/projects/schedule-project'
import { revalidateProjects } from '../revalidate-projects'

const scheduleProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
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
  const publishedIn = new Date(formResult.data['published-in']).toISOString()

  const [_, responseError] = await scheduleProject({
    projectId,
    publishedIn,
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível agendar o projeto.' }
  }

  revalidateProjects(projectId)

  return { success: true, message: 'Projeto agendado para publicação.' }
}
