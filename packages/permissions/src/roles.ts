import z from 'zod'

export const roleSchema = z.enum(['USER', 'STUDENT', 'PROFESSOR', 'ADMIN'])

export type Role = z.infer<typeof roleSchema>
