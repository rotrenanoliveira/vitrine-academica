export class ProjectNotEligibleForPromotionError extends Error {
  constructor(message?: string) {
    super(message ?? 'Somente projetos publicados podem ser promovidos')
    this.name = 'ProjectNotEligibleForPromotionError'
  }
}
