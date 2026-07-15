export interface AppUser {
  id: string
  name: string
  email: string
  title: string
}

export interface AppRole {
  id: string
  name: string
  description: string
  userIds: string[]
  createdAt: string
}

export interface CreateRoleInput {
  name: string
  description: string
}

export interface CreateUserInput {
  name: string
  email: string
  title: string
}
