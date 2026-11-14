import type { FastifyReply } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { FetchAuthorPublishedProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-author-published-projects'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { env } from '@/environment-variables'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchAuthorPublishedProjectsRequest {
  authorId: string
}

export class FetchAuthorPublishedProjectsController {
  constructor(
    private readonly fetchAuthorPublishedProjects: FetchAuthorPublishedProjectsUseCase,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async handle({ authorId }: FetchAuthorPublishedProjectsRequest, reply: FastifyReply) {
    const result = await this.fetchAuthorPublishedProjects.execute({ authorId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    const { author, projects } = result.value

    const coverAttachmentIds = [
      ...new Set(
        projects.map((project) => project.coverUrl).filter((coverUrl): coverUrl is string => Boolean(coverUrl)),
      ),
    ]
    const tagIdsToResolve = [...new Set(projects.flatMap((project) => project.tags))]

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
      author,
      projects: projects.map((project) => {
        const coverUrl = project.coverUrl ? (urlByAttachmentId.get(project.coverUrl) ?? null) : null
        const tagNames = project.tags
          .map((tagId) => nameByTagId.get(tagId))
          .filter((name): name is string => Boolean(name))

        return ProjectPresenter.toHTTPListItem(project, coverUrl, tagNames)
      }),
    })
  }
}
