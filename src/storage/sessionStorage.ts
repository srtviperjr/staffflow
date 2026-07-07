export const SESSION_KEYS = {
  REQUESTS: 'onboarding-requests',
  REQUEST_FORM_DRAFT: 'onboarding-request-form-draft',
  APPROVAL_FORM_DRAFT_PREFIX: 'onboarding-approval-form-draft:',
  MANAGER_FILTER: 'onboarding-manager-filter',
} as const

export function approvalFormDraftKey(requestId: string) {
  return `${SESSION_KEYS.APPROVAL_FORM_DRAFT_PREFIX}${requestId}`
}

export function getSessionItem<T>(key: string, fallback: T): T {
  try {
    const item = sessionStorage.getItem(key)
    if (!item) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

export function setSessionItem<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota or access errors (e.g. private browsing).
  }
}

export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Ignore access errors.
  }
}

/** One-time migration from localStorage to sessionStorage for existing data. */
export function migrateLegacyLocalStorage(): void {
  const legacyKey = SESSION_KEYS.REQUESTS
  try {
    const legacyData = localStorage.getItem(legacyKey)
    if (!legacyData) return

    const hasSessionData = sessionStorage.getItem(legacyKey)
    if (!hasSessionData) {
      sessionStorage.setItem(legacyKey, legacyData)
    }
    localStorage.removeItem(legacyKey)
  } catch {
    // Ignore migration errors.
  }
}
