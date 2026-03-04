export type UserRole = 'normal' | 'admin' | 'dev'

export const ROLE_LABELS: Record<UserRole, string> = {
  normal: 'Normal User',
  admin: 'Admin',
  dev: 'Dev',
}

/** Dev tools: prompt inspector, mock adapter toggle, debug panels */
export function canAccessDevTools(role: UserRole): boolean {
  return role === 'dev' || role === 'admin'
}

/** User management, usage visibility, role assignment */
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}
