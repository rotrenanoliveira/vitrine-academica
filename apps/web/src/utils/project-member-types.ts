export type ProjectMemberStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  status: ProjectMemberStatus
  createdAt: string
}

export interface ProjectMemberListItem {
  id: string
  userId: string
  name: string
  status: ProjectMemberStatus
  createdAt: string
}

export interface ProjectInvitation {
  id: string
  status: ProjectMemberStatus
  createdAt: string
  project: {
    id: string
    title: string
    slug: string
  }
  owner: {
    id: string
    name: string
  } | null
}
