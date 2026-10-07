'use server'

import z from 'zod'
import { registerUser } from '../http/routes/users/register-user'

const registerUserSchema = z.object({
  name: z.string().min(2, 'Informe seu nome.').max(120),
  email: z.email('Informe um e-mail válido.'),
  consent: z.literal('on', {
    error: 'É necessário aceitar os termos para continuar.',
  }),
})

export async function actionRegisterUser(data: FormData) {
  const formResult = registerUserSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { name, email } = formResult.data
  const [_, responseError] = await registerUser({ name, email })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível criar a conta.' }
  }

  return { success: true, message: 'Conta criada. Solicite um código de acesso para entrar.' }
}
