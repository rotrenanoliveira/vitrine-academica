'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { rateProjectByCriteria } from '../http/routes/projects/rate-project-by-criteria'
import { revalidateProjects } from '../revalidate-projects'

const rateProjectByCriteriaSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  scores: z.string().min(1, 'Informe as notas dos critérios.'),
})

export async function actionRateProjectByCriteria(data: FormData) {
  const formResult = rateProjectByCriteriaSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  let scores: Array<{ criterionId: string; score: number }>

  try {
    const parsed = JSON.parse(formResult.data.scores) as unknown
    const scoresSchema = z
      .array(
        z.object({
          criterionId: z.uuid(),
          score: z.number().min(0).max(10),
        }),
      )
      .min(1)

    const scoresResult = scoresSchema.safeParse(parsed)

    if (!scoresResult.success) {
      return { success: false, message: 'Notas inválidas. Use valores entre 0 e 10.' }
    }

    scores = scoresResult.data
  } catch {
    return { success: false, message: 'Não foi possível ler as notas enviadas.' }
  }

  const projectId = formResult.data['project-id']
  const [_, responseError] = await rateProjectByCriteria(projectId, scores)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível salvar a avaliação.' }
  }

  revalidateProjects(projectId)
  revalidatePath('/projetos/avaliados')
  revalidatePath(`/projetos/${projectId}`)

  return { success: true, message: 'Avaliação docente salva.' }
}
