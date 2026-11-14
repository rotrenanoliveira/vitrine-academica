export class ProjectNotPublishedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Somente projetos publicados podem ser inscritos no evento')
    this.name = 'ProjectNotPublishedError'
  }
}
