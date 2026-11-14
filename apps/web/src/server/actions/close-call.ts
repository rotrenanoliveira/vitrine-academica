'use server'

import z from 'zod'
import { closeCall } from '../http/routes/calls/close-call'
import { revalidateCalls } from '../revalidate-calls'

const closeCallSchema = z.object({
  callId: z.uuid('Chamado inválido.'),
})

export async function actionCloseCall(input: { callId: string }) {
  const formResult = closeCallSchema.safeParse(input)

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { callId } = formResult.data

  const [_, responseError] = await closeCall(callId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível encerrar o chamado.' }
  }

  revalidateCalls(callId)

  return { success: true, message: 'Chamado encerrado.' }
}
