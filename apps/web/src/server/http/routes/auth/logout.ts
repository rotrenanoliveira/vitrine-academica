'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function logout() {
  return await fetcher(api.delete('api/v1/auth/sessions'), { notFound: false })
}
