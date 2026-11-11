'use server'

import z from 'zod'
import { applyToCall } from '../http/routes/calls/apply-to-call'
import { revalidateCalls } from '../revalidate-calls'

const applyToCallSchema = z.object({
  'call-id': z.uuid('Chamado inválido.'),
  message: z.string().max(1000, 'A mensagem deve ter no máximo 1000 caracteres.').optional(),
})

export async function actionApplyToCall(data: FormData) {
  const formResult = applyToCallSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const callId = formResult.data['call-id']
  const message = formResult.data.message?.trim()

  const [_, responseError] = await applyToCall({ callId, message: message ? message : undefined })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível enviar a candidatura.' }
  }

  revalidateCalls(callId)

  return { success: true, message: 'Candidatura enviada.' }
}
