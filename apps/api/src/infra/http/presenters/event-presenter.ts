import type { ThemeVoteCounter } from '@/domain/event/application/repositories/votes-repository'
import type { Event } from '@/domain/event/enterprise/entities/event'
import type { EventRegistration } from '@/domain/event/enterprise/entities/event-registration'
import type { Theme } from '@/domain/event/enterprise/entities/theme'
import type { Vote } from '@/domain/event/enterprise/entities/vote'

export class EventPresenter {
  static toHTTP(event: Event) {
    return {
      id: event.id.toString(),
      institutionId: event.institutionId.toString(),
      slug: event.slug,
      name: event.name,
      participationScope: event.participationScope,
      phase: event.phase,
      winnerThemeId: event.winnerThemeId?.toString() ?? null,
      startsAt: event.startsAt.toISOString(),
      themeSelectionEndsAt: event.themeSelectionEndsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt?.toISOString() ?? null,
    }
  }

  static toListHTTP(event: Event, winner: string | null, institutionName: string) {
    return {
      id: event.id.toString(),
      institutionId: event.institutionId.toString(),
      institutionName,
      slug: event.slug,
      name: event.name,
      participationScope: event.participationScope,
      phase: event.phase,
      themeSelectionEndsAt: event.themeSelectionEndsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      winner,
    }
  }
}

export class ThemePresenter {
  static toHTTP(theme: Theme) {
    return {
      id: theme.id.toString(),
      eventId: theme.eventId.toString(),
      authorId: theme.authorId.toString(),
      title: theme.title,
      description: theme.description,
      status: theme.status,
      moderatedByUserId: theme.moderatedByUserId?.toString() ?? null,
      moderatedAt: theme.moderatedAt?.toISOString() ?? null,
      moderationReason: theme.moderationReason,
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt?.toISOString() ?? null,
    }
  }
}

export class VotePresenter {
  static toHTTP(vote: Vote) {
    return {
      id: vote.id.toString(),
      eventId: vote.eventId.toString(),
      themeId: vote.themeId.toString(),
      userId: vote.userId.toString(),
      createdAt: vote.createdAt.toISOString(),
    }
  }
}

export class EventRegistrationPresenter {
  static toHTTP(registration: EventRegistration) {
    return {
      id: registration.id.toString(),
      eventId: registration.eventId.toString(),
      projectId: registration.projectId.toString(),
      responsibleUserId: registration.responsibleUserId.toString(),
      status: registration.status,
      reviewedByUserId: registration.reviewedByUserId?.toString() ?? null,
      reviewedAt: registration.reviewedAt?.toISOString() ?? null,
      reviewReason: registration.reviewReason,
      registeredAt: registration.registeredAt.toISOString(),
    }
  }
}

export class VoteCounterPresenter {
  static toHTTP(counter: ThemeVoteCounter) {
    return {
      themeId: counter.themeId,
      votes: counter.votes,
    }
  }
}
