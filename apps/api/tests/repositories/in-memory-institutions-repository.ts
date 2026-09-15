import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import type { Institution } from '@/domain/institution/enterprise/entities/institutions'

export class InMemoryInstitutionsRepository implements InstitutionsRepository {
  public items: Institution[] = []

  async findAll(): Promise<Institution[]> {
    return this.items
  }

  async findById(id: string): Promise<Institution | null> {
    return this.items.find((institution) => institution.id.toString() === id) ?? null
  }

  async findBySlug(slug: string): Promise<Institution | null> {
    return this.items.find((institution) => institution.slug.value === slug) ?? null
  }

  async create(institution: Institution): Promise<void> {
    this.items.push(institution)
  }

  async save(institution: Institution): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === institution.id.toString())
    if (index === -1) return
    this.items[index] = institution
  }
}
