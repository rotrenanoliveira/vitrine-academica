import { Skeleton } from '@/components/ui/skeleton'

type MeCardsSkeletonProps = {
  count?: number
}

export function MeCardsSkeleton({ count = 3 }: MeCardsSkeletonProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden bg-transparent p-0">
          <div className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
            <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
            <Skeleton className="mt-3 h-3 w-28 rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-auto h-9 w-full rounded-none bg-[#252422]/15" />
          </div>
        </div>
      ))}
    </div>
  )
}
