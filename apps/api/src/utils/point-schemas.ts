import { z } from 'zod'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'
import { PromotionStatus } from '@/domain/points/enterprise/entities/promotion'

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

export const promotionStatusSchema = z.enum(PromotionStatus)

export const promotionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  promoterId: z.string(),
  cost: z.number().int(),
  status: promotionStatusSchema,
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})
