export interface ExportedProject {
  id: string
  title: string
  slug: string
  description: string
  status: string
  coverUrl: string | null
  attachments: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date | null
}

export interface ExportedProjectStar {
  id: string
  projectId: string
  weight: number
  active: boolean
  ratedAt: Date
  createdAt: Date
}

export interface ExportedPromotion {
  id: string
  projectId: string
  cost: number
  status: string
  expiresAt: Date
  createdAt: Date
}

export interface ExportedProjectMember {
  id: string
  projectId: string
  status: string
  createdAt: Date
}

export interface ExportedCall {
  id: string
  title: string
  description: string
  applicationDeadline: Date
  status: string
  projectId: string | null
  createdAt: Date
}

export interface ExportedCallApplication {
  id: string
  callId: string
  message: string | null
  status: string
  decidedAt: Date | null
  createdAt: Date
}

export interface ExportedTeacherRating {
  id: string
  projectId: string
  overallScore: number
  ratedAt: Date
  createdAt: Date
  items: Array<{
    criterionId: string
    score: number
  }>
}

export interface ExportedInstitutionMembershipRequest {
  id: string
  institutionId: string
  role: string
  status: string
  proofAttachmentId: string | null
  createdAt: Date
}

export interface ExportedInstitution {
  id: string
  name: string
  slug: string
  type: string
  status: string
  origin: string
  description: string
  createdAt: Date
}

export interface ExportedEventTheme {
  id: string
  eventId: string
  title: string
  description: string
  status: string
  createdAt: Date
}

export interface ExportedEventVote {
  id: string
  eventId: string
  themeId: string
  createdAt: Date
}

export interface ExportedEventRegistration {
  id: string
  eventId: string
  projectId: string
  status: string
  registeredAt: Date
}

export interface ExportedAuthorSubscription {
  id: string
  authorId: string
  email: string
  status: string
  subscribedAt: Date
  unsubscribedAt: Date | null
}

export interface UserExportedRecords {
  projects: ExportedProject[]
  projectStars: ExportedProjectStar[]
  promotions: ExportedPromotion[]
  projectMembers: ExportedProjectMember[]
  calls: ExportedCall[]
  callApplications: ExportedCallApplication[]
  teacherRatings: ExportedTeacherRating[]
  institutionMembershipRequests: ExportedInstitutionMembershipRequest[]
  registeredInstitutions: ExportedInstitution[]
  eventThemes: ExportedEventTheme[]
  eventVotes: ExportedEventVote[]
  eventRegistrations: ExportedEventRegistration[]
  authorSubscriptions: ExportedAuthorSubscription[]
}

export interface UserDataExportRepository {
  findRecordsByUserId(userId: string): Promise<UserExportedRecords>
}
