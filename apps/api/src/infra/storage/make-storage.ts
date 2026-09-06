import type { Storage } from '@/domain/storage/application/storage/storage'
import { env } from '@/environment-variables'
import { R2Storage } from './r2-storage'

const SIGNED_URL_EXPIRES_IN = 15 * 60 // 15 min

export function makeStorage(): Storage {
  return new R2Storage({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    accountId: env.CLOUDFLARE_R2_ACCOUNT_ID,
    bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    expiresIn: SIGNED_URL_EXPIRES_IN,
  })
}
