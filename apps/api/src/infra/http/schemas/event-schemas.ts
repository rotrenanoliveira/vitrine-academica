import { z } from 'zod'

export const eventPhaseSchema = z.enum(['THEME_SELECTION', 'INSTITUTIONAL_SELECTION', 'OPEN', 'CLOSED'])

export const participationScopeSchema = z.enum(['GLOBAL', 'INSTITUTION'])

export const themeStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'])

export const registrationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const eventHttpSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  slug: z.string(),
  name: z.string().nullable(),
  participationScope: participationScopeSchema,
  phase: eventPhaseSchema,
  winnerThemeId: z.string().nullable(),
  startsAt: z.iso.datetime(),
  themeSelectionEndsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const themeHttpSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  status: themeStatusSchema,
  moderatedByUserId: z.string().nullable(),
  moderatedAt: z.iso.datetime().nullable(),
  moderationReason: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const voteHttpSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  themeId: z.string(),
  userId: z.string(),
  createdAt: z.iso.datetime(),
})

export const registrationHttpSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  projectId: z.string(),
  responsibleUserId: z.string(),
  status: registrationStatusSchema,
  reviewedByUserId: z.string().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  reviewReason: z.string().nullable(),
  registeredAt: z.iso.datetime(),
})

export const voteTallyHttpSchema = z.object({
  themeId: z.string(),
  votes: z.number().int(),
})

export const errorMessageSchema = z.object({
  message: z.string(),
})
