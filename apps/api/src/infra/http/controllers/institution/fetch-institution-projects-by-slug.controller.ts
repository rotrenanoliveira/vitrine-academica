import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import type { FetchInstitutionProjectsBySlugUseCase } from '@/domain/institution/application/use-cases/institution/fetch-institution-projects-by-slug'
import type { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { env } from '@/environment-variables'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchInstitutionProjectsBySlugRequest {
  slug: string
  status?: ProjectStatus
  title?: string
  tagIds?: string[]
  page?: number
  limit?: number
}

export class FetchInstitutionProjectsBySlugController {
  constructor(
    private readonly fetchInstitutionProjectsBySlug: FetchInstitutionProjectsBySlugUseCase,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async handle(
    { slug, status, title, tagIds, page, limit }: FetchInstitutionProjectsBySlugRequest,
    reply: FastifyReply,
  ) {
    const result = await this.fetchInstitutionProjectsBySlug.execute({
      slug,
      status,
      title,
      tagIds,
      page,
      limit,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    const { projects, total, page: currentPage, limit: currentLimit } = result.value

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
      total,
      page: currentPage,
      limit: currentLimit,
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
