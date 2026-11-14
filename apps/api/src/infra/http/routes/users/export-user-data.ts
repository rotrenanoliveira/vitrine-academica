import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeExportUserDataController } from '../../factories/user/make-export-user-data-controller'

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  status: z.string(),
  coverUrl: z.string().nullable(),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
})

const projectStarSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  weight: z.number().int(),
  active: z.boolean(),
  ratedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

const promotionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  cost: z.number().int(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

const projectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
})

const callSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  applicationDeadline: z.coerce.date(),
  status: z.string(),
  projectId: z.string().nullable(),
  createdAt: z.coerce.date(),
})

const callApplicationSchema = z.object({
  id: z.string(),
  callId: z.string(),
  message: z.string().nullable(),
  status: z.string(),
  decidedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

const teacherRatingSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  overallScore: z.number(),
  ratedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  items: z.array(
    z.object({
      criterionId: z.string(),
      score: z.number(),
    }),
  ),
})

const institutionMembershipRequestSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  role: z.string(),
  status: z.string(),
  proofAttachmentId: z.string().nullable(),
  createdAt: z.coerce.date(),
})

const registeredInstitutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  status: z.string(),
  origin: z.string(),
  description: z.string(),
  createdAt: z.coerce.date(),
})

const eventThemeSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
})

const eventVoteSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  themeId: z.string(),
  createdAt: z.coerce.date(),
})

const eventRegistrationSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  projectId: z.string(),
  status: z.string(),
  registeredAt: z.coerce.date(),
})

const authorSubscriptionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  email: z.string(),
  status: z.string(),
  subscribedAt: z.coerce.date(),
  unsubscribedAt: z.coerce.date().nullable(),
})

export async function exportUserDataRoute(app: FastifyInstance) {
  const exportUserDataController = makeExportUserDataController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/users/me/export',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['users'],
        summary: 'Exportar dados do usuário',
        description: 'Exporta todos os dados do usuário autenticado para atendimento à LGPD',
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              status: z.string(),
            }),
            account: z
              .object({
                id: z.string(),
                avatarId: z.string().nullable(),
                createdAt: z.coerce.date(),
                confirmationAt: z.coerce.date().nullable(),
                consentedAt: z.coerce.date().nullable(),
                updatedAt: z.coerce.date().nullable(),
              })
              .nullable(),
            sessions: z.array(
              z.object({ id: z.string(), expiresAt: z.coerce.date(), revokedAt: z.coerce.date().nullable() }),
            ),
            institutions: z.array(
              z.object({
                institutionId: z.string(),
                role: z.string(),
                status: z.string(),
              }),
            ),
            preferences: z.array(
              z.object({
                tagId: z.string(),
              }),
            ),
            points: z.object({
              balance: z.number().int(),
              transactions: z.array(
                z.object({
                  id: z.string(),
                  type: z.string(),
                  amount: z.number().int(),
                  reason: z.string(),
                  referenceId: z.string(),
                  createdAt: z.coerce.date(),
                }),
              ),
            }),
            projects: z.array(projectSchema),
            projectStars: z.array(projectStarSchema),
            promotions: z.array(promotionSchema),
            projectMembers: z.array(projectMemberSchema),
            calls: z.array(callSchema),
            callApplications: z.array(callApplicationSchema),
            teacherRatings: z.array(teacherRatingSchema),
            institutionMembershipRequests: z.array(institutionMembershipRequestSchema),
            registeredInstitutions: z.array(registeredInstitutionSchema),
            eventThemes: z.array(eventThemeSchema),
            eventVotes: z.array(eventVoteSchema),
            eventRegistrations: z.array(eventRegistrationSchema),
            authorSubscriptions: z.array(authorSubscriptionSchema),
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return exportUserDataController.handle(request, reply)
    },
  )
}
