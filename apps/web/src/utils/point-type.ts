import { z } from 'zod'
import { projectSchema } from './type'

export const PROMOTION_COST = 1000
export const PROMOTION_DURATION_DAYS = 7

export const pointTransactionTypeSchema = z.enum(['CREDIT', 'DEBIT'])
export type PointTransactionType = z.infer<typeof pointTransactionTypeSchema>

export const pointTransactionReasonSchema = z.enum(['STAR_RECEIVED', 'PROMOTION'])
export type PointTransactionReason = z.infer<typeof pointTransactionReasonSchema>

export const pointTransactionSchema = z.object({
  id: z.string(),
  type: pointTransactionTypeSchema,
  amount: z.number().int(),
  reason: pointTransactionReasonSchema,
  referenceId: z.string(),
  createdAt: z.string(),
})

export type PointTransaction = z.infer<typeof pointTransactionSchema>

export const promotionStatusSchema = z.enum(['ACTIVE', 'EXPIRED'])
export type PromotionStatus = z.infer<typeof promotionStatusSchema>

export const promotionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  promoterId: z.string(),
  cost: z.number().int(),
  status: promotionStatusSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
})

export type Promotion = z.infer<typeof promotionSchema>

export const activePromotionItemSchema = z.object({
  promotion: promotionSchema,
  project: projectSchema,
  promoter: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

export type ActivePromotionItem = z.infer<typeof activePromotionItemSchema>

export const listActivePromotionsResponseSchema = z.object({
  items: z.array(activePromotionItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
})

export type ListActivePromotionsResponse = z.infer<typeof listActivePromotionsResponseSchema>
