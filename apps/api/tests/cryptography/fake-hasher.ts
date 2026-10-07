import type { Hasher } from '@/domain/identity/application/cryptography/hasher'

export class FakeHasher implements Hasher {
  async hash(plain: string): Promise<string> {
    return `${plain}-hashed`
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `${plain}-hashed`
  }
}
