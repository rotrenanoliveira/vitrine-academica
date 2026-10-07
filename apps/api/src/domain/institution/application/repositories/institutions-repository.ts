import type { Institution } from '../../enterprise/entities/institutions'

export interface InstitutionsRepository {
  findAll(): Promise<Institution[]>
  findById(id: string): Promise<Institution | null>
  findBySlug(slug: string): Promise<Institution | null>

  create(institution: Institution): Promise<void>
  save(institution: Institution): Promise<void>
}
