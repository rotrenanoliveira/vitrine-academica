import { HTTPError } from 'ky'
import { notFound } from 'next/navigation'
import { api } from '../../api-client'

export async function fetchAnalytics<T>(path: string, searchParams?: Record<string, number>) {
  try {
    return await api.get<T>(`api/v1/analytics/${path}`, { searchParams, cache: 'no-store' }).json()
  } catch (error) {
    if (error instanceof HTTPError && (error.response.status === 401 || error.response.status === 403)) {
      notFound()
    }

    throw error
  }
}
