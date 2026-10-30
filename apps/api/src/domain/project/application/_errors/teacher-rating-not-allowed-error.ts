export class TeacherRatingNotAllowedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Apenas professores com vínculo institucional ativo podem avaliar projetos')
    this.name = 'TeacherRatingNotAllowedError'
  }
}
