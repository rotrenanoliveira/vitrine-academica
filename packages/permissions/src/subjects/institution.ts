import z from 'zod'
import { actionSchema } from '../actions'
import { institutionSchema } from '../models/institution'

export const institutionSubject = z.tuple([actionSchema, z.union([z.literal('Institution'), institutionSchema])])
