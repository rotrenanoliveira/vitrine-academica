'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventRegistrationWithContext } from '@/utils/type'
import { api } from '../../api-client'

export async function getMyEventRegistrations() {
  const [response, responseError] = await fetcher(
    api
      .get<{ registrations: EventRegistrationWithContext[] }>('api/v1/events/me/registrations', { cache: 'no-store' })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
