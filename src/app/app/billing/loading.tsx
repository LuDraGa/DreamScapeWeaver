import { Skeleton } from '@/components/design-system/skeleton'

export default function BillingLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Title */}
      <Skeleton className="h-7 w-44 mb-1" />
      <Skeleton className="h-4 w-72 mb-6" />

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
          >
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Top-up packs */}
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
          >
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-12 mb-3" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* History section */}
      <Skeleton className="h-6 w-28 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
