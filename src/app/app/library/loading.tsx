import { Skeleton } from '@/components/design-system/skeleton'

export default function LibraryLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Title */}
      <Skeleton className="h-7 w-32 mb-1" />
      <Skeleton className="h-4 w-56 mb-6" />

      {/* Tabs + search bar */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-40" />
              <div className="flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
