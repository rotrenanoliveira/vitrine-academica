'use server'

import { revalidatePath } from 'next/cache'
import z from 'zod'
import { unsubscribeFromAuthor } from '../http/routes/newsletter/unsubscribe-from-author'

const unsubscribeFromAuthorSchema = z.object({
  'subscription-id': z.string().min(1, 'Assinatura inválida.'),
  'author-id': z.string().min(1).optional(),
})

export async function actionUnsubscribeFromAuthor(data: FormData) {
  const formResult = unsubscribeFromAuthorSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const subscriptionId = formResult.data['subscription-id']
  const authorId = formResult.data['author-id']
  const [_, responseError] = await unsubscribeFromAuthor(subscriptionId)

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível cancelar o acompanhamento.' }
  }

  if (authorId) {
    revalidatePath(`/p/${authorId}`)
  }
  revalidatePath('/conta')

  return { success: true, message: 'Acompanhamento cancelado.' }
}
