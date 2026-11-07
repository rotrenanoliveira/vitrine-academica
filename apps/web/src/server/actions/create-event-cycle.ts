'use server'

import z from 'zod'
import { participationScopeSchema } from '@/utils/type'
import { createEventCycle } from '../http/routes/events/create-event-cycle'
import { revalidateEvents } from '../revalidate-events'

const schema = z.object({
  institutionId: z.uuid('Instituição inválida.'),
  participationScope: participationScopeSchema,
  name: z.string().min(1).optional().nullable(),
})

export async function actionCreateEventCycle(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      message: z.prettifyError(parsed.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const [response, responseError] = await createEventCycle(parsed.data)

  if (responseError) {
    return {
      success: false as const,
      message: responseError.message ?? 'Não foi possível criar o evento.',
    }
  }

  revalidateEvents(response.event.slug)

  return {
    success: true as const,
    message: 'Evento criado.',
    event: response.event,
  }
}
