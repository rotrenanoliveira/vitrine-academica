import { compare, hash } from 'bcryptjs'
import type { Hasher } from '@/domain/identity/application/cryptography/hasher'

const HASH_ROUNDS = 8

export class BcryptHasher implements Hasher {
  hash(plain: string): Promise<string> {
    return hash(plain, HASH_ROUNDS)
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed)
  }
}
