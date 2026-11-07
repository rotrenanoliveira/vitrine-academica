import type { ThemesRepository } from '@/domain/event/application/repositories/themes-repository'
import type { Theme, ThemeStatus } from '@/domain/event/enterprise/entities/theme'

export class InMemoryThemesRepository implements ThemesRepository {
  public items: Theme[] = []

  async findById(id: string): Promise<Theme | null> {
    return this.items.find((theme) => theme.id.toString() === id) ?? null
  }

  async findManyByEventId(eventId: string, status?: ThemeStatus): Promise<Theme[]> {
    return this.items
      .filter((theme) => {
        if (theme.eventId.toString() !== eventId) return false
        if (status && theme.status !== status) return false
        return true
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async create(theme: Theme): Promise<void> {
    this.items.push(theme)
  }

  async save(theme: Theme): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === theme.id.toString())
    if (index === -1) return
    this.items[index] = theme
  }
}
