'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { ThemedCard } from '@/components/design-system/themed-card'
import { CoinsIcon, ZapIcon, TrendingUpIcon, ClockIcon } from '@/components/icons'
import { load as loadCashfree } from '@cashfreepayments/cashfree-js'

interface BalanceData {
  balance: { subscriptionCredits: number, topupCredits: number }
  subscription: { plan_id: string, status: string, current_period_end: string } | null
}

interface LedgerEntry {
  id: string
  amount: number
  type: string
  credit_bucket: string
  created_at: string
}

interface HistoryData {
  entries: LedgerEntry[]
  usage: { totalCreditsUsed: number, actionCounts: Record<string, number> }
}

const PLAN_DETAILS: Record<string, { name: string, credits: number, price: string }> = {
  starter: { name: 'Starter', credits: 100000, price: '₹1,250' },
  pro: { name: 'Pro', credits: 300000, price: '₹3,350' },
  studio: { name: 'Studio', credits: 900000, price: '₹6,700' },
}

const TOPUP_PACKS = [
  { id: 'micro', name: 'Micro', credits: 15000, price: '₹250', tag: null },
  { id: 'small', name: 'Small', credits: 50000, price: '₹750', tag: null },
  { id: 'medium', name: 'Medium', credits: 150000, price: '₹2,100', tag: 'Popular' },
  { id: 'large', name: 'Large', credits: 400000, price: '₹5,000', tag: 'Best value' },
]

function formatCredits(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 100000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return n.toLocaleString()
}

function formatLedgerType(type: string): string {
  const map: Record<string, string> = {
    generation_usage: 'Generation',
    subscription_grant: 'Subscription credit',
    topup_purchase: 'Top-up purchase',
    expiry_sweep: 'Credits expired',
    signup_bonus: 'Welcome bonus',
  }
  return map[type] ?? type
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function BillingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-1 text-text-primary">Billing & Credits</h1>
        <p className="text-sm mb-6 text-text-muted">Manage your subscription and credit balance</p>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-[rgba(15,23,42,0.4)] animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <BillingPage />
    </Suspense>
  )
}

function BillingPage() {
  const { isGuest } = useAuth()
  const searchParams = useSearchParams()
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        fetch('/api/billing/balance'),
        fetch('/api/billing/history'),
      ])
      if (balRes.ok) setBalanceData(await balRes.json())
      if (histRes.ok) setHistoryData(await histRes.json())
    } catch (err) {
      console.error('Failed to fetch billing data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isGuest) fetchData()
    else setLoading(false)
  }, [isGuest, fetchData])

  // Handle return from Cashfree checkout
  useEffect(() => {
    const status = searchParams.get('status')
    const orderId = searchParams.get('order_id')
    const subscription = searchParams.get('subscription')

    if (status === 'SUCCESS' && orderId) {
      showToast('Payment successful! Credits will be added shortly.', 'success')
      // Refresh data after a short delay to allow webhook processing
      setTimeout(fetchData, 2000)
    } else if (status === 'FAILED' && orderId) {
      showToast('Payment failed. Please try again.', 'error')
    } else if (subscription === 'success') {
      showToast('Subscription created! Credits will be granted once payment is confirmed.', 'success')
      setTimeout(fetchData, 2000)
    }
  }, [searchParams, showToast, fetchData])

  // ---------------------------------------------------------------------------
  // Top-up checkout
  // ---------------------------------------------------------------------------
  const handleTopup = async (packId: string) => {
    setActionLoading(`topup-${packId}`)
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to initiate purchase', 'error')
        return
      }

      const { paymentSessionId } = await res.json()

      // Open Cashfree checkout
      const cashfree = await loadCashfree({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production' })
      if (!cashfree) {
        showToast('Payment gateway failed to load', 'error')
        return
      }

      await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' })
    } catch (err) {
      console.error('Topup error:', err)
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (isGuest) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-1 text-text-primary">Billing & Credits</h1>
        <p className="text-sm mb-6 text-text-muted">Sign in to view your credit balance and manage your subscription.</p>
        <ThemedCard>
          <div className="text-center py-8 text-text-muted text-sm">
            Sign in to access billing
          </div>
        </ThemedCard>
      </div>
    )
  }

  const sub = balanceData?.subscription
  const bal = balanceData?.balance ?? { subscriptionCredits: 0, topupCredits: 0 }
  const totalCredits = bal.subscriptionCredits + bal.topupCredits
  const planInfo = sub ? PLAN_DETAILS[sub.plan_id] : null
  const usagePercent = planInfo
    ? Math.min(100, Math.round(((planInfo.credits - bal.subscriptionCredits) / planInfo.credits) * 100))
    : 0

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-1 text-text-primary">Billing & Credits</h1>
      <p className="text-sm mb-6 text-text-muted">Manage your subscription and credit balance</p>

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-right-5 duration-300"
          style={{
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#34d399' : '#f87171',
          }}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-[rgba(15,23,42,0.4)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Credit Balance Hero */}
          <ThemedCard>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <CoinsIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-text-secondary">Credit Balance</h2>
                  <p className="text-2xl font-bold text-text-primary tracking-tight">
                    {formatCredits(totalCredits)}
                    <span className="text-sm font-normal text-text-muted ml-1.5">credits</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Balance breakdown */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 rounded-xl px-4 py-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <ZapIcon className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                  <span className="text-xs text-text-muted">Subscription</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">{formatCredits(bal.subscriptionCredits)}</span>
                {sub && (
                  <span className="text-xs text-text-muted ml-1.5">
                    resets {new Date(sub.current_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex-1 rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUpIcon className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                  <span className="text-xs text-text-muted">Top-up</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">{formatCredits(bal.topupCredits)}</span>
                <span className="text-xs text-text-muted ml-1.5">never expires</span>
              </div>
            </div>

            {/* Usage bar */}
            {(() => {
              let barLabel: string
              let barPercent: number

              if (planInfo) {
                barLabel = 'Subscription usage this period'
                barPercent = usagePercent
              } else {
                // For non-subscribers: show credits used vs total available
                const totalUsed = historyData?.usage.totalCreditsUsed ?? 0
                const totalEver = totalCredits + totalUsed // current balance + what was used
                if (totalEver > 0) {
                  barPercent = Math.min(100, Math.round((totalUsed / totalEver) * 100))
                  barLabel = `${formatCredits(totalCredits)} credits remaining`
                } else {
                  barPercent = 0
                  barLabel = 'No credits used yet'
                }
              }

              return (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">{barLabel}</span>
                    <span className="text-xs text-text-muted">{barPercent}% used</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPercent}%`,
                        background: barPercent > 80
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : planInfo
                            ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                            : 'linear-gradient(90deg, #10b981, #34d399)',
                      }}
                    />
                  </div>
                </div>
              )
            })()}
          </ThemedCard>

          {/* Subscription Plans — Coming Soon */}
          <ThemedCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-0.5">Subscription Plans</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-primary">Coming soon</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                  >
                    Monthly credits + discounts
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {Object.entries(PLAN_DETAILS).map(([id, plan]) => (
                <div
                  key={id}
                  className="rounded-xl px-3 py-3 text-center opacity-50"
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b' }}
                >
                  <div className="text-sm font-semibold text-text-primary mb-0.5">{plan.name}</div>
                  <div className="text-lg font-bold" style={{ color: '#a5b4fc' }}>{plan.price}</div>
                  <div className="text-xs text-text-muted">{formatCredits(plan.credits)} credits/mo</div>
                  <div
                    className="mt-2 text-xs font-medium py-1 rounded-lg"
                    style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}
                  >
                    Coming soon
                  </div>
                </div>
              ))}
            </div>
          </ThemedCard>

          {/* Top-up Packs */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Top up credits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TOPUP_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleTopup(pack.id)}
                  disabled={actionLoading === `topup-${pack.id}`}
                  className="relative rounded-xl px-4 py-4 text-left transition-all hover:scale-[1.02] hover:border-[#6366f1] group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b' }}
                >
                  {pack.tag && (
                    <span
                      className="absolute -top-2 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#6366f1', color: '#fff' }}
                    >
                      {pack.tag}
                    </span>
                  )}
                  <div className="text-xs text-text-muted mb-1">{pack.name}</div>
                  <div className="text-lg font-bold text-text-primary">
                    {actionLoading === `topup-${pack.id}` ? '...' : formatCredits(pack.credits)}
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: '#a5b4fc' }}>{pack.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          {historyData && historyData.usage.totalCreditsUsed > 0 && (
            <ThemedCard>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Usage overview</h3>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(historyData.usage.actionCounts).map(([action, count]) => (
                  <div
                    key={action}
                    className="rounded-lg px-3 py-2"
                    style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.5)' }}
                  >
                    <div className="text-xs text-text-muted capitalize">{action}s</div>
                    <div className="text-sm font-semibold text-text-primary">{count}</div>
                  </div>
                ))}
                <div
                  className="rounded-lg px-3 py-2"
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.5)' }}
                >
                  <div className="text-xs text-text-muted">Total used</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {formatCredits(historyData.usage.totalCreditsUsed)}
                  </div>
                </div>
              </div>
            </ThemedCard>
          )}

          {/* Credit Costs Per Action */}
          <ThemedCard>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Credit costs per action</h3>
            <div className="space-y-0">
              {[
                { action: 'Seed Generation', cost: 500, model: 'gpt-5-mini', icon: '🌱' },
                { action: 'Enhancement', cost: 400, model: 'gpt-5-mini', icon: '✨' },
                { action: 'Story Generation', cost: 1150, model: 'gpt-5-mini', icon: '📝' },
                { action: 'Split into Parts', cost: 1150, model: 'gpt-5-mini', icon: '✂️', note: 'Uses story generation' },
                { action: 'Continue Story', cost: 1150, model: 'gpt-5-mini', icon: '➡️', note: 'Uses story generation' },
                { action: 'Part Transform', cost: 300, model: 'gpt-5-mini', icon: '🔄', tag: 'Coming soon' },
                { action: 'AI Review', cost: 2500, model: 'gpt-5.4', icon: '🔍', tag: 'Admin' },
              ].map((item) => (
                <div
                  key={item.action}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: 'rgba(30,41,59,0.5)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-6 text-center">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary">{item.action}</span>
                        {item.tag && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">{('note' in item && item.note) ? item.note : item.model}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{formatCredits(item.cost)}</span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 px-3 py-2 rounded-lg text-xs text-text-muted"
              style={{ background: 'rgba(15,23,42,0.4)' }}
            >
              A full workflow (seed + generate) costs ~{formatCredits(1650)} credits.
              With a review: ~{formatCredits(4150)} credits.
            </div>
          </ThemedCard>

          {/* Transaction History */}
          <ThemedCard>
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-medium text-text-secondary">Recent activity</h3>
            </div>
            {!historyData?.entries.length ? (
              <div className="text-center py-6 text-text-muted text-sm">
                No activity yet. Generate your first story to see credit usage here.
              </div>
            ) : (
              <div className="space-y-0">
                {historyData.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{ borderColor: 'rgba(30,41,59,0.5)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{
                          background: entry.amount > 0
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(239,68,68,0.12)',
                          color: entry.amount > 0 ? '#34d399' : '#f87171',
                        }}
                      >
                        {entry.amount > 0 ? '+' : '−'}
                      </div>
                      <div>
                        <div className="text-sm text-text-primary">{formatLedgerType(entry.type)}</div>
                        <div className="text-xs text-text-muted">{timeAgo(entry.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-medium"
                        style={{ color: entry.amount > 0 ? '#34d399' : '#f87171' }}
                      >
                        {entry.amount > 0 ? '+' : ''}{formatCredits(Math.abs(entry.amount))}
                      </span>
                      <div className="text-xs text-text-muted capitalize">{entry.credit_bucket}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ThemedCard>
        </div>
      )}
    </div>
  )
}
