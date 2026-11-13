'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { subscribeToAuthor } from '../http/routes/newsletter/subscribe-to-author'

const subscribeToAuthorSchema = z.object({
  'author-id': z.string().min(1, 'Autor inválido.'),
})

export async function actionSubscribeToAuthor(data: FormData) {
  const formResult = subscribeToAuthorSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const authorId = formResult.data['author-id']
  const [_, responseError] = await subscribeToAuthor(authorId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível acompanhar o autor.' }
  }

  revalidatePath(`/p/${authorId}`)
  revalidatePath('/conta')

  return { success: true, message: 'Você agora acompanha este autor.' }
}
