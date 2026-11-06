import { AbilityBuilder, type CreateAbility, createMongoAbility, type MongoAbility } from '@casl/ability'
import z from 'zod'
import type { User } from './models/user'
import { permissions } from './permissions'
import { analyticsSubject } from './subjects/analytics'
import { institutionSubject } from './subjects/institution'
import { projectSubject } from './subjects/project'
import { userSubject } from './subjects/user'

export * from './actions'
export * from './models/institution'
export * from './models/project'
export * from './models/user'
export * from './roles'

const appAbilitiesSchema = z.union([
  projectSubject,
  institutionSubject,
  userSubject,
  analyticsSubject,

  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: Pick<User, 'id' | 'role'>) {
  const builder = new AbilityBuilder(createAppAbility)

  const define = permissions[user.role]

  if (typeof define !== 'function') {
    throw new Error(`No permission defined for role ${user.role}`)
  }

  define(user, builder)

  return builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })
}
