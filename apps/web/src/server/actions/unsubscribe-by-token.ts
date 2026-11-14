'use server'

import z from 'zod'
import { unsubscribeByToken } from '../http/routes/newsletter/unsubscribe-by-token'

const unsubscribeByTokenSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Token de cancelamento inválido.'),
})

export async function actionUnsubscribeByToken(data: FormData) {
  const formResult = unsubscribeByTokenSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const [_, responseError] = await unsubscribeByToken(formResult.data.token)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível cancelar a inscrição.' }
  }

  return { success: true, message: 'Inscrição cancelada com sucesso.' }
}
