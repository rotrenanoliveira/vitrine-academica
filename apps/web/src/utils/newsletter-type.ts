import { z } from 'zod'
import { projectListItemSchema } from './type'

export const subscriptionStatusSchema = z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED'])

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

export const authorSubscriptionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  status: subscriptionStatusSchema,
  subscribedAt: z.string(),
  unsubscribedAt: z.string().nullable(),
})

export type AuthorSubscription = z.infer<typeof authorSubscriptionSchema>

export const mySubscriptionItemSchema = z.object({
  id: z.string(),
  status: subscriptionStatusSchema,
  subscribedAt: z.string(),
  author: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export type MySubscriptionItem = z.infer<typeof mySubscriptionItemSchema>

export const authorPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type AuthorPublic = z.infer<typeof authorPublicSchema>

export const authorProjectsResponseSchema = z.object({
  author: authorPublicSchema,
  projects: z.array(projectListItemSchema),
})

export type AuthorProjectsResponse = z.infer<typeof authorProjectsResponseSchema>
