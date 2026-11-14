'use server'

import z from 'zod'
import { reviewEventRegistration } from '../http/routes/events/review-event-registration'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  registrationId: z.uuid(),
  eventSlug: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().nullable().optional(),
})

export async function actionReviewEventRegistration(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { eventSlug, ...payload } = parsed.data
  const [_, responseError] = await reviewEventRegistration(payload)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível revisar a inscrição.',
    }
  }

  revalidateEvents(eventSlug)

  return { success: true as const, message: 'Inscrição revisada.' }
}
