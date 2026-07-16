import { SAMPLE_PROJECT_AUTHORIZATION_REQUESTS, SAMPLE_STAFFING_PLAN_REQUESTS } from './sampleData'
import { DEFAULT_ROLES, SAMPLE_USERS } from './sampleUsers'
import { SAMPLE_WORKFLOWS } from './sampleWorkflow'
import { isSeedCurrent, markSeedCurrent } from './seedVersion'

/**
 * Replace localStorage demo data when the seed version changes
 * (e.g. after introducing company designations).
 */
export function ensureLatestSeedData() {
  if (isSeedCurrent()) return

  localStorage.setItem('app-users', JSON.stringify(SAMPLE_USERS))
  localStorage.setItem('app-roles', JSON.stringify(DEFAULT_ROLES))
  localStorage.setItem('app-current-user-id', SAMPLE_USERS[0]?.id ?? '')
  localStorage.setItem('staffing-plan-requests', JSON.stringify(SAMPLE_STAFFING_PLAN_REQUESTS))
  localStorage.setItem(
    'project-authorization-requests',
    JSON.stringify(SAMPLE_PROJECT_AUTHORIZATION_REQUESTS),
  )
  localStorage.setItem('workflow-definitions', JSON.stringify(SAMPLE_WORKFLOWS))
  markSeedCurrent()
}
