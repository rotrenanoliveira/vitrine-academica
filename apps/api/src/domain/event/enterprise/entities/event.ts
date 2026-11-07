import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { buildEventWindow } from '@/core/utils/event-calendar'

export enum EventPhase {
  THEME_SELECTION = 'THEME_SELECTION',
  INSTITUTIONAL_SELECTION = 'INSTITUTIONAL_SELECTION',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum ParticipationScope {
  GLOBAL = 'GLOBAL',
  INSTITUTION = 'INSTITUTION',
}

export interface EventProps {
  institutionId: UniqueEntityId
  slug: string
  name: string | null
  participationScope: ParticipationScope
  phase: EventPhase
  winnerThemeId: UniqueEntityId | null
  themeSelectionEndsAt: Date
  startsAt: Date
  endsAt: Date
  createdAt: Date
  updatedAt?: Date | null
}

export class Event extends Entity<EventProps> {
  get institutionId() {
    return this.props.institutionId
  }

  get slug() {
    return this.props.slug
  }

  get name() {
    return this.props.name
  }

  set name(name: string | null) {
    this.props.name = name
    this.touch()
  }

  rename(name: string) {
    this.props.name = name
    this.touch()
  }

  get participationScope() {
    return this.props.participationScope
  }

  get phase() {
    return this.props.phase
  }

  get winnerThemeId() {
    return this.props.winnerThemeId
  }

  get startsAt() {
    return this.props.startsAt
  }

  get themeSelectionEndsAt() {
    return this.props.themeSelectionEndsAt
  }

  get endsAt() {
    return this.props.endsAt
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isPubliclyListed() {
    return this.props.phase === EventPhase.OPEN || this.props.phase === EventPhase.CLOSED
  }

  isAcceptingThemeSuggestions(now = new Date()) {
    return this.props.phase === EventPhase.THEME_SELECTION && now < this.props.themeSelectionEndsAt
  }

  isAcceptingVotes(now = new Date()) {
    return this.isAcceptingThemeSuggestions(now)
  }

  isAcceptingRegistrations(now = new Date()) {
    return this.props.phase === EventPhase.OPEN && now < this.props.endsAt
  }

  closeThemeVoting() {
    if (this.props.phase !== EventPhase.THEME_SELECTION) {
      throw new Error('InvalidEventPhaseError')
    }

    this.props.phase = EventPhase.INSTITUTIONAL_SELECTION
    this.touch()
  }

  selectWinnerTheme(themeId: UniqueEntityId) {
    const canSelectEarly = this.props.phase === EventPhase.THEME_SELECTION
    const canSelectAfterVoting = this.props.phase === EventPhase.INSTITUTIONAL_SELECTION

    if (!canSelectEarly && !canSelectAfterVoting) {
      throw new Error('InvalidEventPhaseError')
    }

    this.props.winnerThemeId = themeId
    this.props.phase = EventPhase.OPEN
    this.touch()
  }

  closeRegistrations() {
    if (this.props.phase !== EventPhase.OPEN) {
      throw new Error('InvalidEventPhaseError')
    }

    if (!this.props.winnerThemeId) {
      throw new Error('InvalidEventPhaseError')
    }

    this.props.phase = EventPhase.CLOSED
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<EventProps, 'createdAt' | 'phase' | 'winnerThemeId' | 'name' | 'themeSelectionEndsAt' | 'endsAt'>,
    id?: UniqueEntityId,
  ) {
    const window = buildEventWindow(props.startsAt)

    return new Event(
      {
        ...props,
        name: props.name ?? null,
        phase: props.phase ?? EventPhase.THEME_SELECTION,
        winnerThemeId: props.winnerThemeId ?? null,
        themeSelectionEndsAt: props.themeSelectionEndsAt ?? window.themeSelectionEndsAt,
        endsAt: props.endsAt ?? window.endsAt,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
