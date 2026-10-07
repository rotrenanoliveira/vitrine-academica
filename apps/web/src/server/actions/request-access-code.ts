'use server'

import z from 'zod'
import { requestAccessCode } from '../http/routes/auth/request-access-code'

const requestAccessCodeSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
})

export async function actionRequestAccessCode(data: FormData) {
  const formResult = requestAccessCodeSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const [_, responseError] = await requestAccessCode(formResult.data)

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível enviar o código.',
    }
  }

  return { success: true, message: 'Código enviado. Verifique seu e-mail.' }
}
