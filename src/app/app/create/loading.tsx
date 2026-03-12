import { Skeleton } from '@/components/design-system/skeleton'

export default function CreateLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <Skeleton className="h-7 w-40 mb-1" />
      <Skeleton className="h-4 w-64 mb-6" />

      {/* Step indicator bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-xl" />
        ))}
      </div>

      {/* Main content card */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(30,41,59,0.5)' }}>
        {/* Chunk area */}
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-32 w-full mb-4 rounded-xl" />
        <Skeleton className="h-32 w-full mb-4 rounded-xl" />

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
