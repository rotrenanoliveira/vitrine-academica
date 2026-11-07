import type { Theme, ThemeStatus } from '../../enterprise/entities/theme'

export interface ThemesRepository {
  findById(id: string): Promise<Theme | null>
  findManyByEventId(eventId: string, status?: ThemeStatus): Promise<Theme[]>

  create(theme: Theme): Promise<void>
  save(theme: Theme): Promise<void>
}
