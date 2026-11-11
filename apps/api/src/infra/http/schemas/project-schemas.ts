import z from 'zod'

export const projectHttpSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  coverUrl: z.string().nullable(),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

export const projectListHttpSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  coverUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  tags: z.array(z.string()),
})
