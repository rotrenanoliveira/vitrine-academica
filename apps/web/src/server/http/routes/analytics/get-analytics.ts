import type { InstitutionsAnalytics, ProjectsAnalytics, TagsAnalytics, UsersAnalytics } from '@/utils/analytics-type'
import { fetchAnalytics } from './fetch-analytics'

export function getProjectsAnalytics(days: number) {
  return fetchAnalytics<ProjectsAnalytics>('projects', { days })
}

export function getUsersAnalytics(days: number) {
  return fetchAnalytics<UsersAnalytics>('users', { days })
}

export function getInstitutionsAnalytics() {
  return fetchAnalytics<InstitutionsAnalytics>('institutions')
}

export function getTagsAnalytics(limit: number) {
  return fetchAnalytics<TagsAnalytics>('tags', { limit })
}
