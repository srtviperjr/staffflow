import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppRole, AppUser, CreateRoleInput } from '../types/roles'
import { DEFAULT_ROLES, SAMPLE_USERS } from '../data/sampleUsers'

const USERS_STORAGE_KEY = 'app-users'
const ROLES_STORAGE_KEY = 'app-roles'

interface RolesContextValue {
  users: AppUser[]
  roles: AppRole[]
  createRole: (input: CreateRoleInput) => AppRole
  assignUsersToRole: (roleId: string, userIds: string[]) => void
  getRoleById: (roleId: string) => AppRole | undefined
  resetSampleData: () => void
}

const RolesContext = createContext<RolesContextValue | null>(null)

function loadUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as AppUser[]
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SAMPLE_USERS))
    return SAMPLE_USERS
  } catch {
    return SAMPLE_USERS
  }
}

function loadRoles(): AppRole[] {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as AppRole[]
    }
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES))
    return DEFAULT_ROLES
  } catch {
    return DEFAULT_ROLES
  }
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function saveRoles(roles: AppRole[]) {
  localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
}

export function RolesProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadUsers)
  const [roles, setRoles] = useState<AppRole[]>(loadRoles)

  const createRole = useCallback((input: CreateRoleInput) => {
    const name = input.name.trim()
    const newRole: AppRole = {
      id: crypto.randomUUID(),
      name,
      description: input.description.trim(),
      userIds: [],
      createdAt: new Date().toISOString(),
    }

    setRoles((prev) => {
      const updated = [...prev, newRole]
      saveRoles(updated)
      return updated
    })

    return newRole
  }, [])

  const assignUsersToRole = useCallback((roleId: string, userIds: string[]) => {
    setRoles((prev) => {
      const updated = prev.map((role) =>
        role.id === roleId ? { ...role, userIds: [...userIds] } : role,
      )
      saveRoles(updated)
      return updated
    })
  }, [])

  const getRoleById = useCallback(
    (roleId: string) => roles.find((role) => role.id === roleId),
    [roles],
  )

  const resetSampleData = useCallback(() => {
    setUsers(SAMPLE_USERS)
    setRoles(DEFAULT_ROLES)
    saveUsers(SAMPLE_USERS)
    saveRoles(DEFAULT_ROLES)
  }, [])

  const value = useMemo(
    () => ({
      users,
      roles,
      createRole,
      assignUsersToRole,
      getRoleById,
      resetSampleData,
    }),
    [users, roles, createRole, assignUsersToRole, getRoleById, resetSampleData],
  )

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider')
  }
  return context
}
