'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SparklesIcon, PenIcon, BookIcon, GearIcon, LayersIcon } from '@/components/icons'

const navItems = [
  { id: 'create', label: 'Create', icon: PenIcon, href: '/app/create' },
  { id: 'studio', label: 'Studio', icon: LayersIcon, href: '/app/studio' },
  { id: 'library', label: 'Library', icon: BookIcon, href: '/app/library' },
  { id: 'settings', label: 'Settings', icon: GearIcon, href: '/app/settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

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

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-2 mt-auto px-3 py-2 rounded-xl text-xs text-[#64748b] hover:text-[#f1f5f9] hover:bg-[rgba(15,23,42,0.5)] transition-all"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
