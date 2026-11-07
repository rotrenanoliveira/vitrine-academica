import type { FastifyReply } from 'fastify/types/reply'
import type { GetCurationUseCase } from '@/domain/curation/application/use-cases/get-curation'
import { CurationPresenter } from '../../presenters/curation-presenter'

interface GetCurationQuey {
  institutionId?: string | undefined
  months?: number | undefined
  limit?: number | undefined
}

export class GetCurationController {
  constructor(private readonly getCuration: GetCurationUseCase) {}

  async handle(query: GetCurationQuey, reply: FastifyReply) {
    const result = await this.getCuration.execute(query)

    return reply.status(200).send({
      board: result.value.board.map(CurationPresenter.teacherEntryToHTTP),
      community: result.value.community.map(CurationPresenter.communityEntryToHTTP),
    })
  }
}
