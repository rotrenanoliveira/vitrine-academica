import type {
  UserDataExportRepository,
  UserExportedRecords,
} from '@/domain/identity/application/repositories/user-data-export-repository'

function makeEmptyRecords(): UserExportedRecords {
  return {
    projects: [],
    projectStars: [],
    promotions: [],
    projectMembers: [],
    calls: [],
    callApplications: [],
    teacherRatings: [],
    institutionMembershipRequests: [],
    registeredInstitutions: [],
    eventThemes: [],
    eventVotes: [],
    eventRegistrations: [],
    authorSubscriptions: [],
  }
}

export class InMemoryUserDataExportRepository implements UserDataExportRepository {
  public recordsByUser = new Map<string, Partial<UserExportedRecords>>()

  async findRecordsByUserId(userId: string): Promise<UserExportedRecords> {
    return { ...makeEmptyRecords(), ...this.recordsByUser.get(userId) }
  }
}
