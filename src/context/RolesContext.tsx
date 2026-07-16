import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppRole, AppUser, CreateRoleInput, CreateUserInput } from '../types/roles'
import { DEFAULT_ROLES, SAMPLE_USERS } from '../data/sampleUsers'

const USERS_STORAGE_KEY = 'app-users'
const ROLES_STORAGE_KEY = 'app-roles'
const CURRENT_USER_STORAGE_KEY = 'app-current-user-id'

interface RolesContextValue {
  users: AppUser[]
  roles: AppRole[]
  currentUser: AppUser | null
  currentUserRoles: AppRole[]
  setCurrentUserId: (userId: string) => void
  createUser: (input: CreateUserInput) => AppUser
  updateUser: (userId: string, input: CreateUserInput) => void
  deleteUser: (userId: string) => void
  setRolesForUser: (userId: string, roleIds: string[]) => void
  createRole: (input: CreateRoleInput) => AppRole
  assignUsersToRole: (roleId: string, userIds: string[]) => void
  getRoleById: (roleId: string) => AppRole | undefined
  getRolesForUser: (userId: string) => AppRole[]
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

function loadCurrentUserId(users: AppUser[]): string {
  try {
    const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (stored && users.some((user) => user.id === stored)) {
      return stored
    }
  } catch {
    // fall through to default
  }
  return users[0]?.id ?? ''
}

function saveCurrentUserId(userId: string) {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId)
}

export function RolesProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadUsers)
  const [roles, setRoles] = useState<AppRole[]>(loadRoles)
  const [currentUserId, setCurrentUserIdState] = useState(() => loadCurrentUserId(loadUsers()))

  const setCurrentUserId = useCallback(
    (userId: string) => {
      if (!users.some((user) => user.id === userId)) return
      setCurrentUserIdState(userId)
      saveCurrentUserId(userId)
    },
    [users],
  )

  const getRolesForUser = useCallback(
    (userId: string) => roles.filter((role) => role.userIds.includes(userId)),
    [roles],
  )

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0] ?? null,
    [users, currentUserId],
  )

  const currentUserRoles = useMemo(
    () => (currentUser ? getRolesForUser(currentUser.id) : []),
    [currentUser, getRolesForUser],
  )

  const createUser = useCallback(
    (input: CreateUserInput) => {
      const newUser: AppUser = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email: input.email.trim(),
        title: input.title.trim(),
        company: input.company,
      }

      setUsers((prev) => {
        const updated = [...prev, newUser]
        saveUsers(updated)
        return updated
      })

      return newUser
    },
    [],
  )

  const updateUser = useCallback((userId: string, input: CreateUserInput) => {
    setUsers((prev) => {
      const updated = prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              name: input.name.trim(),
              email: input.email.trim(),
              title: input.title.trim(),
              company: input.company,
            }
          : user,
      )
      saveUsers(updated)
      return updated
    })
  }, [])

  const deleteUser = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const updated = prev.filter((user) => user.id !== userId)
        saveUsers(updated)

        if (currentUserId === userId) {
          const fallbackId = updated[0]?.id ?? ''
          setCurrentUserIdState(fallbackId)
          if (fallbackId) saveCurrentUserId(fallbackId)
          else localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
        }

        return updated
      })

      setRoles((prev) => {
        const updated = prev.map((role) => ({
          ...role,
          userIds: role.userIds.filter((id) => id !== userId),
        }))
        saveRoles(updated)
        return updated
      })
    },
    [currentUserId],
  )

  const setRolesForUser = useCallback((userId: string, roleIds: string[]) => {
    const selected = new Set(roleIds)
    setRoles((prev) => {
      const updated = prev.map((role) => {
        const hasUser = role.userIds.includes(userId)
        const shouldHave = selected.has(role.id)
        if (hasUser === shouldHave) return role
        return {
          ...role,
          userIds: shouldHave
            ? [...role.userIds, userId]
            : role.userIds.filter((id) => id !== userId),
        }
      })
      saveRoles(updated)
      return updated
    })
  }, [])

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
    const defaultUserId = SAMPLE_USERS[0]?.id ?? ''
    setCurrentUserIdState(defaultUserId)
    if (defaultUserId) saveCurrentUserId(defaultUserId)
  }, [])

  const value = useMemo(
    () => ({
      users,
      roles,
      currentUser,
      currentUserRoles,
      setCurrentUserId,
      createUser,
      updateUser,
      deleteUser,
      setRolesForUser,
      createRole,
      assignUsersToRole,
      getRoleById,
      getRolesForUser,
      resetSampleData,
    }),
    [
      users,
      roles,
      currentUser,
      currentUserRoles,
      setCurrentUserId,
      createUser,
      updateUser,
      deleteUser,
      setRolesForUser,
      createRole,
      assignUsersToRole,
      getRoleById,
      getRolesForUser,
      resetSampleData,
    ],
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
