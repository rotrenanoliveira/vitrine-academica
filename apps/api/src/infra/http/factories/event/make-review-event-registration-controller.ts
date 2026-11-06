import { ReviewEventRegistrationUseCase } from '@/domain/event/application/use-cases/event-registration/review-event-registration'
import { ReviewEventRegistrationController } from '../../controllers/event/review-event-registration.controller'
import { makeEventDeps } from './make-event-deps'

export function makeReviewEventRegistrationController() {
  const deps = makeEventDeps()
  const reviewEventRegistrationUseCase = new ReviewEventRegistrationUseCase(
    deps.eventsRepository,
    deps.eventRegistrationsRepository,
    deps.institutionMembersRepository,
    deps.registerLog,
  )

  return new ReviewEventRegistrationController(reviewEventRegistrationUseCase)
}
