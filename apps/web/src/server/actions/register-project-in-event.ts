'use server'

import z from 'zod'
import { registerProjectInEvent } from '../http/routes/events/register-project-in-event'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  eventId: z.uuid(),
  eventSlug: z.string().min(1),
  projectId: z.uuid(),
})

export async function actionRegisterProjectInEvent(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await registerProjectInEvent(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível inscrever o projeto.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Projeto inscrito. Aguardando aprovação.' }
}
