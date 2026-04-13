export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
  )
}

export function SensorCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-28 h-8 mb-2" />
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-32 h-3 mt-2" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-10 h-4" />
      </div>
      <Skeleton className="w-full h-48" />
    </div>
  )
}

export function AlertSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
          <Skeleton className="w-2 h-2 rounded-full mt-1 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}