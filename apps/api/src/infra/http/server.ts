import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AdvanceDueEventPhasesUseCase } from '@/domain/event/application/use-cases/event/advance-due-event-phases'
import { ExpireDuePromotionsUseCase } from '@/domain/points/application/use-cases/promotion/expire-due-promotions'
import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { env } from '@/environment-variables'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleEventsRepository } from '@/infra/database/repositories/drizzle-events-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePromotionsRepository } from '@/infra/database/repositories/drizzle-promotions-repository'
import { startAdvanceEventPhaseJob } from '../jobs/advance-event-phase-job'
import { startExpirePromotionsJob } from '../jobs/expire-promotions-job'
import { startPublishScheduledProjectsJob } from '../jobs/publish-scheduled-projects-job'
import { startNewsletterScheduler } from '../jobs/start-newsletter-scheduler'
import { app } from './app'
import { makePublicationNotifier } from './factories/newsletter/make-publication-notifier'

//Ligando a função que publica sozinho os projetos de acordo com os horários do agendamento
function startScheduler() {
  const registerLog = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const publishScheduledProjects = new PublishScheduledProjectsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectScheduledRepository(db),
    registerLog,
    makePublicationNotifier(),
  )

  startPublishScheduledProjectsJob({
    publishScheduledProjects,
    onPublished: (total) => app.log.info(`[Scheduled]: ${total} projeto(s) publicado(s)`),
    onError: (error) => app.log.error({ err: error }, '[Scheduled]: falha ao publicar os projetos agendados'),
  })

  const advanceDueEventPhases = new AdvanceDueEventPhasesUseCase(new DrizzleEventsRepository(db), registerLog)

  startAdvanceEventPhaseJob({
    advanceDueEventPhases,
    onAdvanced: ({ closedThemeSelection, closedEvents }) =>
      app.log.info(
        `[Event Scheduler]: ${closedThemeSelection} escolha(s) encerrada(s), ${closedEvents} evento(s) encerrado(s)`,
      ),
    onError: (error) => app.log.error({ err: error }, '[Event Scheduler]: falha ao avançar fases de eventos'),
  })

  const expireDuePromotions = new ExpireDuePromotionsUseCase(new DrizzlePromotionsRepository(db), registerLog)

  startExpirePromotionsJob({
    expireDuePromotions,
    onExpired: (total) => app.log.info(`[Promotion Scheduler]: ${total} promoção(ões) encerrada(s)`),
    onError: (error) => app.log.error({ err: error }, '[Promotion Scheduler]: falha ao encerrar promoções vencidas'),
  })

  app.log.info(
    '[Agendador]: ligado, verifica projetos agendados, fases de eventos e promoções vencidas a cada 30 segundos',
  startNewsletterScheduler(app.log)

  app.log.info(
    '[Scheduled]: ligado, verifica projetos agendados, fases de eventos e avisos da newsletter a cada 30 segundos',
  )
}

app.listen(
  {
    port: env.PORT,
    host: '0.0.0.0',
  },
  (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`[HTTP]: Server is running on ${address}`)

    // O agendador só liga depois que o servidor subiu sem erro
    startScheduler()
  },
)
