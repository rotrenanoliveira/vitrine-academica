import { listMyStarredProjects } from '../http/routes/projects/list-my-starred-projects'

export async function loadStarredProjectIds(authenticated: boolean) {
  if (!authenticated) return [] as string[]

  try {
    const { items } = await listMyStarredProjects()
    return items.map((item) => item.project.id)
  } catch {
    return [] as string[]
  }
}
