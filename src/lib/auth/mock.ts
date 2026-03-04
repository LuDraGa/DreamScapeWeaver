import type { UserRole } from '@/lib/auth/roles'
import type { User } from '@/lib/types'

const MOCK_SESSION_KEY = 'sw_mock_session'

export function getMockUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(MOCK_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setMockUser(role: UserRole): User {
  const user: User = {
    id: `mock-${role}`,
    email: `${role}@dev.local`,
    role,
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
  return user
}

export function clearMockUser() {
  localStorage.removeItem(MOCK_SESSION_KEY)
}
