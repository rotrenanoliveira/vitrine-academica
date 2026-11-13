'use server'

import z from 'zod'
import { projectStatusSchema } from '@/utils/type'
import { updateProject } from '../http/routes/projects/update-project'
import { revalidateProjects } from '../revalidate-projects'

const updateProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
  title: z.string().min(1, 'Informe o título.').max(200),
  description: z.string().min(1, 'Informe a descrição.'),
  status: projectStatusSchema,
})

export async function actionUpdateProject(data: FormData) {
  const formResult = updateProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const id = formResult.data['project-id']
  const slug = formResult.data['project-slug']
  const [_, responseError] = await updateProject({
    id,
    title: formResult.data.title,
    description: formResult.data.description,
    status: formResult.data.status,
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível atualizar o projeto.' }
  }

  revalidateProjects(slug)

  return { success: true, message: 'Projeto atualizado.' }
}
