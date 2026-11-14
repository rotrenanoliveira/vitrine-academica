import { Skeleton } from '@/components/ui/skeleton'

type DestaquesProjectsGridSkeletonProps = {
  count?: number
}

export function DestaquesProjectsGridSkeleton({ count = 6 }: DestaquesProjectsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-8" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={index % 2 === 1 ? 'md:mt-16' : undefined}>
          <div className="overflow-hidden bg-transparent p-0">
            <div className="p-2">
              <div className="border border-[#252422]/30 bg-[#e6e0d7] p-2 shadow-[5px_5px_0_rgba(37,36,34,0.08)]">
                <Skeleton className="relative aspect-4/3 rounded-none bg-[#c6c0b8]" />
              </div>
            </div>
            <div className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
              <Skeleton className="mb-3 h-3 w-20 rounded-none bg-[#252422]/15" />
              <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
              <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-auto h-5 w-36 rounded-none bg-[#252422]/15" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
