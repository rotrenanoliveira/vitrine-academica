import z from 'zod'

export const actionSchema = z.enum(['manage', 'create', 'read', 'update', 'delete'])

export type Action = z.infer<typeof actionSchema>
