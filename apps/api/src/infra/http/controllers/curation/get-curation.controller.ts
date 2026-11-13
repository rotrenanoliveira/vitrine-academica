import type { FastifyReply } from 'fastify/types/reply'
import type { CurationScope, GetCurationUseCase } from '@/domain/curation/application/use-cases/get-curation'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { env } from '@/environment-variables'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface GetCurationQuery {
  institutionId?: string | undefined
  months?: number | undefined
  limit?: number | undefined
  scope?: CurationScope | undefined
  title?: string | undefined
  tagIds?: string[] | undefined
}

export class GetCurationController {
  constructor(
    private readonly getCuration: GetCurationUseCase,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async handle(query: GetCurationQuery, reply: FastifyReply) {
    const result = await this.getCuration.execute(query)
    const projects = result.value.projects

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
      total: projects.length,
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
