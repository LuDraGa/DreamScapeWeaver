import { Skeleton } from '@/components/design-system/skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <Skeleton className="h-7 w-28 mb-1" />
      <Skeleton className="h-4 w-48 mb-6" />

      {/* Default Preset card */}
      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
      >
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Avoid Phrases card */}
      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
      >
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-40 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Toggle cards */}
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-6 mb-4"
          style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
