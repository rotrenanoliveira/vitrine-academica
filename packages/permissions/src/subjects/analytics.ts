import z from 'zod'
import { actionSchema } from '../actions'

export const analyticsSubject = z.tuple([actionSchema, z.literal('Analytics')])
