const { faker } = require('@faker-js/faker/locale/pt_BR')

import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UniqueEntityId as UniqueEntityIdClass } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import {
  Institution,
  InstitutionOrigin,
  type InstitutionProps,
  InstitutionType,
} from '@/domain/institution/enterprise/entities/institutions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'

export function makeInstitution(override: Partial<InstitutionProps> = {}, id?: UniqueEntityId) {
  const name = override.name ?? faker.company.name()

  const institution = Institution.create(
    {
      name,
      slug: override.slug ?? Slug.createFromText(name),
      type: InstitutionType.UNIVERSITY,
      origin: InstitutionOrigin.USER_REGISTRATION,
      description: faker.lorem.paragraph(),
      registerBy: new UniqueEntityIdClass(),
      shouldProof: false,
      shouldVerify: false,
      ...override,
    },
    id,
  )

  return { institution }
}

export async function makeInstitutionOnDatabase(override: Partial<InstitutionProps> = {}, id?: UniqueEntityId) {
  const { institution } = makeInstitution(override, id)

  const institutionsRepository = new DrizzleInstitutionsRepository(db)

  await institutionsRepository.create(institution)

  return { institution }
}
