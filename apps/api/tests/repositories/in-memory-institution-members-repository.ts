import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionMember } from '@/domain/institution/enterprise/entities/institution-member'

export class InMemoryInstitutionMembersRepository implements InstitutionMembersRepository {
  public items: InstitutionMember[] = []

  async findById(id: string): Promise<InstitutionMember | null> {
    return this.items.find((member) => member.id.toString() === id) ?? null
  }

  async findManyByInstitutionId(institutionId: string): Promise<InstitutionMember[]> {
    return this.items.filter((member) => member.institutionId === institutionId)
  }

  async findManyByUserId(userId: string): Promise<InstitutionMember[]> {
    return this.items.filter((member) => member.userId === userId)
  }

  async findByInstitutionAndUser(institutionId: string, userId: string): Promise<InstitutionMember | null> {
    return this.items.find((member) => member.institutionId === institutionId && member.userId === userId) ?? null
  }

  async create(member: InstitutionMember): Promise<void> {
    this.items.push(member)
  }

  async save(member: InstitutionMember): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === member.id.toString())
    if (index === -1) return
    this.items[index] = member
  }
}
