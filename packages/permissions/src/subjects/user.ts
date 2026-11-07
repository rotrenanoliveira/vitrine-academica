import z from 'zod'
import { actionSchema } from '../actions'
import { userSchema } from '../models/user'

export const userSubject = z.tuple([actionSchema, z.union([z.literal('User'), userSchema])])
