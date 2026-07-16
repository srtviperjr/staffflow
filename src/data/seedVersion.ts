/** Bump when sample data shape or content must replace stored localStorage. */
export const APP_SEED_VERSION = 'paf-date-overlap-bulk-v1'
export const APP_SEED_VERSION_KEY = 'app-seed-version'

export function isSeedCurrent(): boolean {
  try {
    return localStorage.getItem(APP_SEED_VERSION_KEY) === APP_SEED_VERSION
  } catch {
    return false
  }
}

export function markSeedCurrent() {
  localStorage.setItem(APP_SEED_VERSION_KEY, APP_SEED_VERSION)
}
