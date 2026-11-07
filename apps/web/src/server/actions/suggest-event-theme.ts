'use server'

import z from 'zod'
import { suggestTheme } from '../http/routes/events/suggest-theme'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  eventId: z.uuid(),
  eventSlug: z.string().min(1),
  title: z.string().min(1, 'Título obrigatório.'),
  description: z.string().min(1, 'Descrição obrigatória.'),
})

export async function actionSuggestEventTheme(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await suggestTheme(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível sugerir o tema.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Tema sugerido.' }
}
