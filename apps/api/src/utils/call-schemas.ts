import { z } from 'zod'
import { CallStatus } from '@/domain/call/enterprise/entities/call'

export const callStatusSchema = z.enum(CallStatus)

export const callSkillSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  description: z.string().nullable(),
})

export const callSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  applicationDeadline: z.iso.datetime(),
  status: callStatusSchema,
  projectId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const callWithSkillsSchema = callSchema.extend({
  skills: z.array(callSkillSchema),
})

export const callListItemSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  applicationDeadline: z.iso.datetime(),
  status: callStatusSchema,
  projectSlug: z.string().nullable(),
  skills: z.array(z.string()),
})

export const callSkillInputSchema = z.object({
  tagId: z.uuid().describe('O ID da tag que representa a habilidade'),
  description: z.string().min(1).max(200).nullish().describe('Detalhe opcional da habilidade'),
})
