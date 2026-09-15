import { z } from 'zod'

export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED'])

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  status: userStatusSchema,
  accountId: z.string(),
})

export type User = z.infer<typeof userSchema>

export const projectStatusSchema = z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'])

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: projectStatusSchema,
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.string(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const projectScheduledSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  publishedIn: z.string(),
  createdAt: z.string(),
})

export type ProjectScheduled = z.infer<typeof projectScheduledSchema>

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export type Tag = z.infer<typeof tagSchema>

export const preferenceTagStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const preferenceTagSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  userId: z.string(),
  status: preferenceTagStatusSchema,
  createdAt: z.string(),
})

export type PreferenceTag = z.infer<typeof preferenceTagSchema>

export const institutionTypeSchema = z.enum(['UNIVERSITY', 'COLLEGE', 'CENTER', 'TECHNICAL_COLLEGE', 'OTHER'])

export const institutionStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'])

export const institutionOriginSchema = z.enum(['SEED', 'USER_REGISTRATION', 'ADMIN'])

export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: institutionTypeSchema,
  status: institutionStatusSchema,
  origin: institutionOriginSchema,
  description: z.string(),
  registerBy: z.string(),
  shouldProof: z.boolean(),
  shouldVerify: z.boolean(),
  domain: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type Institution = z.infer<typeof institutionSchema>
export type InstitutionType = z.infer<typeof institutionTypeSchema>
export type InstitutionStatus = z.infer<typeof institutionStatusSchema>
export type InstitutionOrigin = z.infer<typeof institutionOriginSchema>

export const institutionMemberRoleSchema = z.enum([
  'STUDENT',
  'PROFESSOR',
  'TEACHER',
  'MANAGER',
  'ADMINISTRATIVE_OFFICE',
])

export const institutionMemberStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'FINISHED',
  'PENDING',
  'REJECTED',
])

export const institutionMemberSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  userId: z.string(),
  role: institutionMemberRoleSchema,
  status: institutionMemberStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type InstitutionMember = z.infer<typeof institutionMemberSchema>
export type InstitutionMemberRole = z.infer<typeof institutionMemberRoleSchema>
export type InstitutionMemberStatus = z.infer<typeof institutionMemberStatusSchema>

export const institutionMembershipRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const institutionMembershipRequestSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  userId: z.string(),
  role: institutionMemberRoleSchema,
  status: institutionMembershipRequestStatusSchema,
  proofAttachmentId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type InstitutionMembershipRequest = z.infer<typeof institutionMembershipRequestSchema>
export type InstitutionMembershipRequestStatus = z.infer<typeof institutionMembershipRequestStatusSchema>

export const attachmentSchema = z.object({
  id: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  name: z.string(),
  size: z.number(),
  createdAt: z.string(),
})

export type Attachment = z.infer<typeof attachmentSchema>
