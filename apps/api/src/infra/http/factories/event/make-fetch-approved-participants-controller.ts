import { FetchApprovedParticipantsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-approved-participants'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchApprovedParticipantsController } from '../../controllers/event/fetch-approved-participants.controller'
import { makeEventDeps } from './make-event-deps'

export function makeFetchApprovedParticipantsController() {
  const deps = makeEventDeps()
  const fetchApprovedParticipantsUseCase = new FetchApprovedParticipantsUseCase(
    deps.eventsRepository,
    deps.eventRegistrationsRepository,
    deps.projectsRepository,
  )
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)

  return new FetchApprovedParticipantsController(
    fetchApprovedParticipantsUseCase,
    attachmentsRepository,
    tagsRepository,
  )
}
