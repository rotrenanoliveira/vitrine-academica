import { z } from 'zod'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '@/domain/institution/enterprise/entities/institution-membership-request'
import {
  InstitutionOrigin,
  InstitutionStatus,
  InstitutionType,
} from '@/domain/institution/enterprise/entities/institutions'

export const institutionTypeSchema = z.enum(InstitutionType)

export const institutionStatusSchema = z.enum(InstitutionStatus)

export const institutionOriginSchema = z.enum(InstitutionOrigin)

export const institutionMemberRoleSchema = z.enum(InstitutionMemberRole)

export const institutionMemberStatusSchema = z.enum(InstitutionMemberStatus)

export const institutionMembershipRequestRoleSchema = z.enum(InstitutionMembershipRequestRole)

export const institutionMembershipRequestStatusSchema = z.enum(InstitutionMembershipRequestStatus)

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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const institutionMemberSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  userId: z.string(),
  role: institutionMemberRoleSchema,
  status: institutionMemberStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const institutionMembershipRequestSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  userId: z.string(),
  role: institutionMembershipRequestRoleSchema,
  status: institutionMembershipRequestStatusSchema,
  proofAttachmentId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const messageSchema = z.object({
  message: z.string(),
})
