export class ProjectTagNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag não vinculada ao projeto')
    this.name = 'ProjectTagNotFoundError'
  }
}
