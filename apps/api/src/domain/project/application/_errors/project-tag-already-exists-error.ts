export class ProjectTagAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag já cadastrada no projeto')
    this.name = 'ProjectTagAlreadyExistsError'
  }
}
