'use server'

import z from 'zod'
import { selectInstitutionalTheme } from '../http/routes/events/select-institutional-theme'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  eventId: z.uuid(),
  eventSlug: z.string().min(1),
  themeId: z.uuid(),
})

export async function actionSelectInstitutionalTheme(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [response, responseError] = await selectInstitutionalTheme(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível selecionar o tema.',
    }
  }

  revalidateEvents(eventSlug)

  return {
    success: true as const,
    message: 'Tema selecionado. Evento aberto.',
    event: response.event,
  }
}
