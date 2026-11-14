import type { FastifyReply } from 'fastify'
import type { FetchProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-projects'
import type { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { FetchUserPreferenceTagsUseCase } from '@/domain/tag/application/use-cases/preference-tag/fetch-user-preference-tags'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'
import { env } from '@/environment-variables'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchProjectsRequest {
  userId?: string
  scope?: 'all' | 'user'
  status?: ProjectStatus
  title?: string
  tagIds?: string[]
  page?: number
  limit?: number
}

export class FetchProjectsController {
  constructor(
    private readonly fetchProjects: FetchProjectsUseCase,
    private readonly fetchUserPreferenceTags: FetchUserPreferenceTagsUseCase,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async handle({ userId, scope, status, title, tagIds, page, limit }: FetchProjectsRequest, reply: FastifyReply) {
    if (scope === 'user' && !userId) {
      return reply.status(401).send({
        message: 'Não autenticado.',
      })
    }

    const personalize = scope === 'user' || (!scope && Boolean(userId))
    let resolvedTagIds = tagIds

    if (personalize && userId) {
      const preferenceTagsResult = await this.fetchUserPreferenceTags.execute({ userId })

      if (preferenceTagsResult.isLeft()) {
        return reply.status(404).send({
          message: preferenceTagsResult.value.message,
        })
      }

      const activeTagIds = preferenceTagsResult.value.preferenceTags
        .filter((preferenceTag) => preferenceTag.status === PreferenceTagStatus.ACTIVE)
        .map((preferenceTag) => preferenceTag.tagId.toString())

      resolvedTagIds =
        tagIds && tagIds.length > 0 ? activeTagIds.filter((tagId) => tagIds.includes(tagId)) : activeTagIds
    }

    const result = await this.fetchProjects.execute({
      status,
      title,
      tagIds: resolvedTagIds && resolvedTagIds.length > 0 ? resolvedTagIds : undefined,
      page,
      limit,
    })

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
