import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  CreateSignedUrlParams,
  CreateSignedUrlResponse,
  Storage,
} from '@/domain/storage/application/storage/storage'

interface R2StorageConfig {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  expiresIn: number
}

export class R2Storage implements Storage {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly expiresIn: number

  constructor(config: R2StorageConfig) {
    this.bucket = config.bucket
    this.expiresIn = config.expiresIn

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async createSignedUrl({ key, mimeType, size }: CreateSignedUrlParams): Promise<CreateSignedUrlResponse> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ContentLength: size,
    })

    const putUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.expiresIn,
    })

    return {
      url: putUrl,
      expiresIn: this.expiresIn,
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
  }
}
