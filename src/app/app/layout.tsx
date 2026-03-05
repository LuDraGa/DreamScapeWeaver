'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SparklesIcon, PenIcon, BookIcon, GearIcon, LayersIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth/context'
import { useAppStore } from '@/store/app-store'
import { LoginModal } from '@/components/auth/LoginModal'

const navItems = [
  { id: 'create', label: 'Create', icon: PenIcon, href: '/app/create', guestAllowed: true },
  { id: 'studio', label: 'Studio', icon: LayersIcon, href: '/app/studio', guestAllowed: false },
  { id: 'library', label: 'Library', icon: BookIcon, href: '/app/library', guestAllowed: false },
  { id: 'settings', label: 'Settings', icon: GearIcon, href: '/app/settings', guestAllowed: false },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, isGuest, isLoading, logout } = useAuth()
  const { openLoginModal } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <nav
        className={cn(
          'h-full flex flex-col py-4 shrink-0 transition-all duration-300 border-r border-border',
          'bg-[rgba(15,23,42,0.4)]',
          sidebarCollapsed ? 'w-16' : 'w-[200px]'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-2.5 px-4 mb-8', sidebarCollapsed ? 'justify-center' : '')}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight text-text-primary">StoryWeaver</span>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            const locked = isGuest && !item.guestAllowed

            if (locked) {
              return (
                <button
                  key={item.id}
                  onClick={openLoginModal}
                  title={`Sign in to access ${item.label}`}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : '',
                    'opacity-35 cursor-pointer hover:opacity-50'
                  )}
                  style={{ color: '#64748b' }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : '',
                  active
                    ? 'bg-[rgba(99,102,241,0.12)] text-[#a5b4fc]'
                    : 'bg-transparent text-[#64748b] hover:text-[#f1f5f9]'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Auth section */}
        <div className="px-2 mb-2">
          {!isLoading && (
            isGuest ? (
              /* Sign in button — indigo, prominent */
              <button
                onClick={openLoginModal}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  'hover:opacity-90 active:scale-[0.98]',
                  sidebarCollapsed ? 'justify-center' : ''
                )}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  color: '#fff',
                  boxShadow: '0 0 16px rgba(99,102,241,0.35)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
                  <path
                    d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zM5 7.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    opacity="0.3"
                  />
                  <path
                    d="M7.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
                    fill="currentColor"
                  />
                </svg>
                {!sidebarCollapsed && <span>Sign in</span>}
                {!sidebarCollapsed && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto opacity-70">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ) : (
              /* Logged-in user row */
              <div
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl',
                  sidebarCollapsed ? 'justify-center' : ''
                )}
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff' }}
                >
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span
                      className="text-xs flex-1 truncate"
                      style={{ color: '#94a3b8' }}
                      title={user?.email}
                    >
                      {user?.email}
                    </span>
                    {/* Logout button */}
                    <button
                      onClick={logout}
                      title="Sign out"
                      className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                      style={{ color: '#94a3b8' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h3M9 9l3-3-3-3M12 6.5H5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-2 px-3 py-2 rounded-xl text-xs text-[#64748b] hover:text-[#f1f5f9] hover:bg-[rgba(15,23,42,0.5)] transition-all"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>

      {/* Global login modal */}
      <LoginModal />
    </div>
  )
}
