export class ProjectNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Projeto não encontrado')
    this.name = 'ProjectNotFoundError'
  }
}
