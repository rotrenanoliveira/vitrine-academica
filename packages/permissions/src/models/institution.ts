import z from 'zod'

export const institutionSchema = z.object({
  __typename: z.literal('Institution').default('Institution'),
  id: z.string(),
})

export type Institution = z.infer<typeof institutionSchema>
