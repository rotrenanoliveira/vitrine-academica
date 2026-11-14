import type { FastifyReply } from 'fastify'
import type { FetchCallsUseCase } from '@/domain/call/application/use-cases/call/fetch-calls'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { CallPresenter } from '../../presenters/call-presenter'

interface FetchCallsQuery {
  tagIds?: string[]
}

export class FetchCallsController {
  constructor(
    private readonly fetchCalls: FetchCallsUseCase,
    private readonly tagsRepository: TagsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async handle({ tagIds }: FetchCallsQuery, reply: FastifyReply) {
    const result = await this.fetchCalls.execute({ tagIds })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    const callsWithSkills = result.value.calls

    const tagIdsToResolve = [
      ...new Set(callsWithSkills.flatMap(({ skills }) => skills.map((skill) => skill.tagId.toString()))),
    ]
    const projectIds = [
      ...new Set(
        callsWithSkills
          .map(({ call }) => call.projectId?.toString())
          .filter((projectId): projectId is string => Boolean(projectId)),
      ),
    ]

    const [tags, projects] = await Promise.all([
      this.tagsRepository.findManyByIds(tagIdsToResolve),
      this.projectsRepository.findManyByIds(projectIds),
    ])

    const nameByTagId = new Map(tags.map((tag) => [tag.id.toString(), tag.name]))
    const slugByProjectId = new Map(projects.map((project) => [project.id.toString(), project.slug]))

    return reply.status(200).send({
      calls: callsWithSkills.map(({ call, skills }) => {
        const skillNames = skills
          .map((skill) => nameByTagId.get(skill.tagId.toString()))
          .filter((name): name is string => Boolean(name))
        const projectSlug = call.projectId ? (slugByProjectId.get(call.projectId.toString()) ?? null) : null

        return CallPresenter.toHTTPListItem(call, skillNames, projectSlug)
      }),
    })
  }
}
