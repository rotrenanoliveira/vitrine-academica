import { z } from 'zod'

export const periodQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export const tagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const labelCountSchema = z.object({
  label: z.string(),
  total: z.number().int(),
})

export const dailyCountSchema = z.object({
  date: z.string(),
  total: z.number().int(),
})

export const messageSchema = z.object({
  message: z.string(),
})
