import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AdvanceDueEventPhasesUseCase } from '@/domain/event/application/use-cases/event/advance-due-event-phases'
import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { env } from '@/environment-variables'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleEventsRepository } from '@/infra/database/repositories/drizzle-events-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { startAdvanceEventPhaseJob } from '../jobs/advance-event-phase-job'
import { startPublishScheduledProjectsJob } from '../jobs/publish-scheduled-projects-job'
import { app } from './app'

//Ligando a função que publica sozinho os projetos de acordo com os horários do agendamento
function startScheduler() {
  const registerLog = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const publishScheduledProjects = new PublishScheduledProjectsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectScheduledRepository(db),
    registerLog,
  )

  startPublishScheduledProjectsJob({
    publishScheduledProjects,
    onPublished: (total) => app.log.info(`[Agendador]: ${total} projeto(s) publicado(s)`),
    onError: (error) => app.log.error({ err: error }, '[Agendador]: falha ao publicar os projetos agendados'),
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

  app.log.info('[Agendador]: ligado, verifica projetos agendados e fases de eventos a cada 30 segundos')
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
