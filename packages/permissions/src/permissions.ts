import type { AbilityBuilder } from '@casl/ability'
import type { AppAbility } from '.'
import type { User } from './models/user'
import type { Role } from './roles'

type AbilityUser = Pick<User, 'id' | 'role'>

type PermissionByRole = (user: AbilityUser, builder: AbilityBuilder<AppAbility>) => void

// Aluno e professor: leem tudo e gerenciam apenas os próprios projetos.
const memberPermissions: PermissionByRole = (user, { can }) => {
  can('read', 'Project')
  can('read', 'Institution')
  can('create', 'Project')
  can(['update', 'delete'], 'Project', { authorId: { $eq: user.id } })
}

// Atenção: por enquanto, apenas o assunto 'Analytics' é verificado nas rotas.
export const permissions: Record<Role, PermissionByRole> = {
  USER: (_, { can }) => {
    can('read', 'Project')
    can('read', 'Institution')
  },
  STUDENT: memberPermissions,
  PROFESSOR: memberPermissions,
  ADMIN: (_, { can }) => {
    can('manage', 'all')
  },
}
