'use server'

import z from 'zod'
import { callSkillsSchema, parseCallSkills } from '@/utils/call-form'
import { parseDateTimeLocalValue } from '@/utils/call-utils'
import { updateCall } from '../http/routes/calls/update-call'
import { revalidateCalls } from '../revalidate-calls'

const updateCallSchema = z.object({
  'call-id': z.uuid('Chamado inválido.'),
  title: z.string().min(1, 'Informe o título.').max(200),
  description: z.string().min(1, 'Informe a proposta do chamado.'),
  'application-deadline': z.string().min(1, 'Informe o prazo das candidaturas.'),
  skills: callSkillsSchema,
})

export async function actionUpdateCall(data: FormData) {
  const formResult = updateCallSchema.safeParse({
    'call-id': data.get('call-id'),
    title: data.get('title'),
    description: data.get('description'),
    'application-deadline': data.get('application-deadline'),
    skills: parseCallSkills(data),
  })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const applicationDeadline = parseDateTimeLocalValue(formResult.data['application-deadline'])

  if (!applicationDeadline) {
    return { success: false, message: 'Prazo das candidaturas inválido.' }
  }

  const id = formResult.data['call-id']

  const [_, responseError] = await updateCall({
    id,
    title: formResult.data.title,
    description: formResult.data.description,
    applicationDeadline,
    skills: formResult.data.skills,
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível atualizar o chamado.' }
  }

  revalidateCalls(id)

  return { success: true, message: 'Chamado atualizado.' }
}