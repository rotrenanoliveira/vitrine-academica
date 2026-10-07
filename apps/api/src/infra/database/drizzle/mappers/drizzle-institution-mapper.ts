import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import {
  Institution,
  type InstitutionOrigin,
  type InstitutionStatus,
  type InstitutionType,
} from '@/domain/institution/enterprise/entities/institutions'
import type { institutions } from '../schemas/institutions'

type DrizzleInstitution = typeof institutions.$inferSelect
type DrizzleInstitutionInsert = typeof institutions.$inferInsert

export class DrizzleInstitutionMapper {
  static toDomain(row: DrizzleInstitution): Institution {
    return Institution.create(
      {
        name: row.name,
        slug: Slug.create(row.slug),
        type: row.type as InstitutionType,
        status: row.status as InstitutionStatus,
        origin: row.origin as InstitutionOrigin,
        description: row.description,
        registerBy: new UniqueEntityId(row.registerBy),
        shouldProof: row.shouldProof,
        shouldVerify: row.shouldVerify,
        domain: row.domain ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(institution: Institution): DrizzleInstitutionInsert {
    return {
      id: institution.id.toString(),
      name: institution.name,
      slug: institution.slug.value,
      type: institution.type,
      status: institution.status,
      origin: institution.origin,
      description: institution.description,
      registerBy: institution.registerBy.toString(),
      shouldProof: institution.shouldProof,
      shouldVerify: institution.shouldVerify,
      domain: institution.domain,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt ?? undefined,
    }
  }
}
