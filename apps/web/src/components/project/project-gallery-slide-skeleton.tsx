import { Skeleton } from '@/components/ui/skeleton'

export function ProjectGallerySlideSkeleton() {
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label
    <div className="flex flex-col gap-10" aria-busy="true" aria-label="Carregando projetos">
      <div className="relative">
        <div className="border border-[#252422]/35 bg-[#e6e0d7] p-2 shadow-[10px_10px_0_rgba(37,36,34,0.10)] sm:p-3">
          <Skeleton className="relative aspect-video rounded-none bg-[#c6c0b8]" />
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-28 rounded-none bg-[#252422]/15" />
          <Skeleton className="h-3 w-40 rounded-none bg-[#252422]/15" />
        </div>

        <div className="mt-5 flex items-stretch gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 bg-[#ebe6de] p-6">
            <div className="flex flex-col justify-center gap-3">
              <Skeleton className="h-8 w-3/4 max-w-md rounded-none bg-[#252422]/15 sm:h-9" />
              <Skeleton className="h-4 w-full rounded-none bg-[#252422]/10" />
              <Skeleton className="h-4 w-5/6 rounded-none bg-[#252422]/10" />
            </div>
          </div>

          <Skeleton className="size-14 shrink-0 self-stretch rounded-none bg-[#252422]/25 sm:w-16" />
        </div>
      </div>
    </div>
  )
}
