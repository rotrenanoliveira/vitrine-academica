import type { Project } from '@/domain/project/enterprise/entities/project'
import type { Event } from '../../enterprise/entities/event'
import type { EventRegistration } from '../../enterprise/entities/event-registration'

export interface EventRegistrationWithContext {
  registration: EventRegistration
  event: Event
  project: Project
}
