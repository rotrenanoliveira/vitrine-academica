export class ProjectNotEligibleForRatingError extends Error {
  constructor(message?: string) {
    super(message ?? 'Projeto não elegível para avaliação')
    this.name = 'ProjectNotEligibleForRatingError'
  }
}
