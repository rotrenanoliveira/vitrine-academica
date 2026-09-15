import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  AccessCode,
  type AccessCodeProps,
} from '@/domain/identity/enterprise/entities/access-code'
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccessCodesRepository } from '@/infra/database/repositories/drizzle-access-codes-repository'

export function makeAccessCode(override: Partial<AccessCodeProps> = {}, id?: UniqueEntityId) {
  const accessCode = AccessCode.create(
    {
      accountId: new UniqueEntityId(),
      codeHash: '123456-hashed',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      ...override,
    },
    id,
  )

  return { accessCode }
}

export async function makeAccessCodeOnDatabase(
  override: Partial<AccessCodeProps> & { plainCode?: string } = {},
  id?: UniqueEntityId,
) {
  const { plainCode, ...props } = override
  const hasher = new BcryptHasher()
  const code = plainCode ?? 'ABCDEF123456'
  const codeHash = props.codeHash ?? (await hasher.hash(code))

  const { accessCode } = makeAccessCode(
    {
      ...props,
      codeHash,
    },
    id,
  )

  const accessCodesRepository = new DrizzleAccessCodesRepository(db)
  await accessCodesRepository.create(accessCode)

  return { accessCode, plainCode: code }
}
