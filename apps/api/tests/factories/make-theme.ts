const { faker } = require('@faker-js/faker/locale/pt_BR')

import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Theme, type ThemeProps } from '@/domain/event/enterprise/entities/theme'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleThemesRepository } from '@/infra/database/repositories/drizzle-themes-repository'

export function makeTheme(override: Partial<ThemeProps> = {}, id?: UniqueEntityId) {
  const theme = Theme.create(
    {
      eventId: override.eventId ?? new UniqueEntityId(),
      authorId: override.authorId ?? new UniqueEntityId(),
      title: override.title ?? faker.lorem.sentence(),
      description: override.description ?? faker.lorem.paragraph(),
      ...override,
    },
    id,
  )

  return { theme }
}

export async function makeThemeOnDatabase(override: Partial<ThemeProps> = {}, id?: UniqueEntityId) {
  const { theme } = makeTheme(override, id)
  await new DrizzleThemesRepository(db).create(theme)
  return { theme }
}
