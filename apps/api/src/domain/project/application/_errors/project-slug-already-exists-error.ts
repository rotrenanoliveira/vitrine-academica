export class ProjectSlugAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Já existe um projeto com este slug')
    this.name = 'ProjectSlugAlreadyExistsError'
  }
}
