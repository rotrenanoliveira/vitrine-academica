'use server'

import z from 'zod'
import { moderateTheme } from '../http/routes/events/moderate-theme'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  themeId: z.uuid(),
  eventSlug: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT', 'HIDE']),
  reason: z.string().nullable().optional(),
})

export async function actionModerateEventTheme(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await moderateTheme(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível moderar o tema.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Tema moderado.' }
}
