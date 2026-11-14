import type { FastifyReply } from 'fastify'
import type { FetchScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/fetch-scheduled-projects'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { env } from '@/environment-variables'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class FetchScheduledProjectsController {
  constructor(
    private readonly fetchScheduledProjects: FetchScheduledProjectsUseCase,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchScheduledProjects.execute()
    const scheduledProjects = result.value.scheduledProjects

    const coverAttachmentIds = [
      ...new Set(
        scheduledProjects
          .map(({ project }) => project.coverUrl)
          .filter((coverUrl): coverUrl is string => Boolean(coverUrl)),
      ),
    ]
    const tagIdsToResolve = [...new Set(scheduledProjects.flatMap(({ project }) => project.tags))]

    const [attachments, tags] = await Promise.all([
      this.attachmentsRepository.findManyByIds(coverAttachmentIds),
      this.tagsRepository.findManyByIds(tagIdsToResolve),
    ])

    const urlByAttachmentId = new Map(
      attachments.map((attachment) => [
        attachment.id.toString(),
        `${env.CLOUDFLARE_R2_ASSETS_URL}/${attachment.storageKey}`,
      ]),
    )
    const nameByTagId = new Map(tags.map((tag) => [tag.id.toString(), tag.name]))

    return reply.status(200).send({
      scheduledProjects: scheduledProjects.map(({ project, publishedIn }) => {
        const coverUrl = project.coverUrl ? (urlByAttachmentId.get(project.coverUrl) ?? null) : null
        const tagNames = project.tags
          .map((tagId) => nameByTagId.get(tagId))
          .filter((name): name is string => Boolean(name))

        return {
          project: ProjectPresenter.toHTTPListItem(project, coverUrl, tagNames),
          publishedIn: publishedIn.toISOString(),
        }
      }),
    })
  }
}
