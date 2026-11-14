'use server'

import z from 'zod'
import { editEventName } from '../http/routes/events/edit-event-name'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  eventId: z.uuid(),
  eventSlug: z.string().min(1),
  name: z.string().min(1, 'Nome obrigatório.'),
})

export async function actionEditEventName(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await editEventName(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível editar o evento.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Nome atualizado.' }
}
