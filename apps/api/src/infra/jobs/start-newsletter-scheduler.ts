import type { FastifyBaseLogger } from 'fastify'
import { SendPendingNotificationsUseCase } from '@/domain/newsletter/application/use-cases/send-pending-notifications'
import { env } from '@/environment-variables'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePublicationNotificationsRepository } from '@/infra/database/repositories/drizzle-publication-notifications-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeEmail } from '@/infra/mail/make-mail'
import { startSendPendingNotificationsJob } from './send-pending-notifications-job'

export function startNewsletterScheduler(logger: FastifyBaseLogger) {
  const sendPendingNotifications = new SendPendingNotificationsUseCase(
    new DrizzlePublicationNotificationsRepository(db),
    new DrizzleAuthorSubscriptionsRepository(db),
    new DrizzleProjectsRepository(db),
    new DrizzleUsersRepository(db),
    makeEmail(),
  )

  return startSendPendingNotificationsJob({
    sendPendingNotifications,
    webUrl: env.WEB_URL,
    onSent: ({ sent, failed }) => logger.info(`[Newsletter]: ${sent} e-mail(s) enviado(s), ${failed} falha(s)`),
    onError: (error) => logger.error({ err: error }, '[Newsletter]: falha ao enviar os avisos pendentes'),
  })
}
