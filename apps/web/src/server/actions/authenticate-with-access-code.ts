'use server'

import z from 'zod'
import { setAccessTokenCookie } from '../auth/cookies'
import { authenticateWithAccessCode } from '../http/routes/auth/authenticate-with-access-code'

const authenticateWithAccessCodeSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  code: z.string().min(1, 'Informe o código de acesso.'),
})

export async function actionAuthenticateWithAccessCode(data: FormData) {
  const formResult = authenticateWithAccessCodeSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const [response, responseError] = await authenticateWithAccessCode(formResult.data)

  if (responseError || !response) {
    return {
      success: false,
      message: responseError?.message ?? 'Não foi possível autenticar.',
    }
  }

  await setAccessTokenCookie(response.accessToken)

  return { success: true, message: 'Sessão iniciada.' }
}
