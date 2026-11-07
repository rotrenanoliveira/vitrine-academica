import { z } from 'zod'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { callStatusSchema } from '@/utils/call-schemas'
import { institutionMemberRoleSchema } from '@/utils/institution-schemas'

export const callApplicationStatusSchema = z.enum(CallApplicationStatus)

export const callApplicationSchema = z.object({
  id: z.string(),
  callId: z.string(),
  applicantId: z.string(),
  message: z.string().nullable(),
  status: callApplicationStatusSchema,
  decidedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
})

export const callApplicantSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberships: z.array(
    z.object({
      institutionId: z.string(),
      institutionName: z.string(),
      role: institutionMemberRoleSchema,
    }),
  ),
})

export const callApplicationWithApplicantSchema = callApplicationSchema.extend({
  applicant: callApplicantSchema,
})

export const callSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: callStatusSchema,
  applicationDeadline: z.iso.datetime(),
})

export const callApplicationWithCallSchema = callApplicationSchema.extend({
  call: callSummarySchema,
})
