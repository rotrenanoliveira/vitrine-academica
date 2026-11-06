import type {
  CreateSignedUrlParams,
  CreateSignedUrlResponse,
  Storage,
} from '@/domain/storage/application/storage/storage'

export const TEST_STORAGE_ORIGIN = 'https://storage.test'

const SIGNED_URL_EXPIRES_IN = 15 * 60 // 15 min

export class TestStorage implements Storage {
  private readonly blobs = new Map<string, Buffer>()
  private readonly expiresIn = SIGNED_URL_EXPIRES_IN

  async createSignedUrl({ key }: CreateSignedUrlParams): Promise<CreateSignedUrlResponse> {
    return {
      url: `${TEST_STORAGE_ORIGIN}/${key}?signed=1`,
      expiresIn: this.expiresIn,
    }
  }

  async put(key: string, body: Buffer): Promise<void> {
    this.blobs.set(key, body)
  }

  async get(key: string): Promise<Buffer | undefined> {
    return this.blobs.get(key)
  }

  has(key: string): boolean {
    return this.blobs.has(key)
  }

  async delete(key: string): Promise<void> {
    this.blobs.delete(key)
  }

  clear(): void {
    this.blobs.clear()
  }
}

let testStorage: TestStorage | null = null

export function getTestStorage(): TestStorage {
  if (!testStorage) {
    testStorage = new TestStorage()
  }

  return testStorage
}

export function resetTestStorage(): void {
  getTestStorage().clear()
}
