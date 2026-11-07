'use server'

import z from 'zod'
import { voteTheme } from '../http/routes/events/vote-theme'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  eventId: z.uuid(),
  eventSlug: z.string().min(1),
  themeId: z.uuid(),
})

export async function actionVoteEventTheme(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await voteTheme(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível registrar o voto.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Voto registrado.' }
}
