import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { env } from '@/environment-variables'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { startPublishScheduledProjectsJob } from '../jobs/publish-scheduled-projects-job'
import { app } from './app'

//Ligando a função que publica sozinho os projetos de acordo com os horários do agendamento
function startScheduler() {
  const publishScheduledProjects = new PublishScheduledProjectsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectScheduledRepository(db),
    new RegisterLogUseCase(new DrizzleAuditLogsRepository(db)),
  )

  startPublishScheduledProjectsJob({
    publishScheduledProjects,
    onPublished: (total) => app.log.info(`[Agendador]: ${total} projeto(s) publicado(s)`),
    onError: (error) => app.log.error({ err: error }, '[Agendador]: falha ao publicar os projetos agendados'),
  })

  app.log.info('[Agendador]: ligado, verifica os projetos agendados a cada 30 segundos')
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
