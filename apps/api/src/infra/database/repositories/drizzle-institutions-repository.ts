import { eq } from 'drizzle-orm'
import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import type { Institution } from '@/domain/institution/enterprise/entities/institutions'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleInstitutionMapper } from '../drizzle/mappers/drizzle-institution-mapper'
import { institutions } from '../drizzle/schemas'

export class DrizzleInstitutionsRepository implements InstitutionsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<Institution[]> {
    const rows = await this.db.select().from(institutions)

    return rows.map(DrizzleInstitutionMapper.toDomain)
  }

  async findById(id: string): Promise<Institution | null> {
    const [row] = await this.db.select().from(institutions).where(eq(institutions.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMapper.toDomain(row)
  }

  async findBySlug(slug: string): Promise<Institution | null> {
    const [row] = await this.db.select().from(institutions).where(eq(institutions.slug, slug)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMapper.toDomain(row)
  }

  async create(institution: Institution): Promise<void> {
    await this.db.insert(institutions).values(DrizzleInstitutionMapper.toPersistence(institution))
  }

  async save(institution: Institution): Promise<void> {
    await this.db
      .update(institutions)
      .set(DrizzleInstitutionMapper.toPersistence(institution))
      .where(eq(institutions.id, institution.id.toString()))
  }
}
