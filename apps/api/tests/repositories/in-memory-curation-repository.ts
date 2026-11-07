import type {
  CommunityCurationEntry,
  CurationFilters,
  CurationRepository,
  TeacherCurationEntry,
} from '@/domain/curation/application/repositories/curation-repository'

export class InMemoryCurationRepository implements CurationRepository {
  public teacherEntries: TeacherCurationEntry[] = []
  public communityEntries: CommunityCurationEntry[] = []
  public lastTeacherFilters: CurationFilters | null = null
  public lastCommunityFilters: CurationFilters | null = null

  async findTopByTeachers(filters: CurationFilters): Promise<TeacherCurationEntry[]> {
    this.lastTeacherFilters = filters

    return this.teacherEntries.slice(0, filters.limit)
  }

  async findTopByCommunity(filters: CurationFilters): Promise<CommunityCurationEntry[]> {
    this.lastCommunityFilters = filters

    return this.communityEntries.slice(0, filters.limit)
  }
}
