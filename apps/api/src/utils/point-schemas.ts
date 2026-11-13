import { z } from 'zod'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'

export const pointTransactionTypeSchema = z.enum(PointTransactionType)

export const pointTransactionReasonSchema = z.enum(PointTransactionReason)

export const pointTransactionSchema = z.object({
  id: z.string(),
  type: pointTransactionTypeSchema,
  amount: z.number().int(),
  reason: pointTransactionReasonSchema,
  referenceId: z.string(),
  createdAt: z.iso.datetime(),
})
