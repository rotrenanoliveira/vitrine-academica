import z from 'zod'
import { actionSchema } from '../actions'
import { projectSchema } from '../models/project'

export const projectSubject = z.tuple([actionSchema, z.union([z.literal('Project'), projectSchema])])
