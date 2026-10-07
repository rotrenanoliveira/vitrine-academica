import type {
  CreateSignedUrlParams,
  CreateSignedUrlResponse,
  Storage,
} from '@/domain/storage/application/storage/storage'

export class InMemoryStorage implements Storage {
  private expiresIn: number = 600

  public items: CreateSignedUrlParams[] = []
  public keys: string[] = []

  async createSignedUrl(params: CreateSignedUrlParams): Promise<CreateSignedUrlResponse> {
    this.items.push(params)

    return {
      url: `https://www.vitrineacademica.app/${params.key}/signed=1`,
      expiresIn: this.expiresIn,
    }
  }

  async delete(key: string): Promise<void> {
    this.keys.push(key)
  }
}
