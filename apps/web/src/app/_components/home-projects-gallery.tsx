'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ProjectGallery } from '@/components/project/project-gallery'
import { ProjectGallerySlideSkeleton } from '@/components/project/project-gallery-slide-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPublishedProjectsWithCover } from '@/server/http/routes/projects/fetch-published-projects'

const PAGE_LIMIT = 25

function HomeProjectsLoadMoreSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="overflow-hidden bg-transparent p-0">
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
      ))}
    </div>
  )
}

export function HomeProjectsGallery() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } = useInfiniteQuery({
    queryKey: ['projects', { status: 'PUBLISHED', scope: 'user', limit: PAGE_LIMIT }],
    queryFn: ({ pageParam }) => fetchPublishedProjectsWithCover({ page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total
      return hasMore ? lastPage.page + 1 : undefined
    },
  })

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isPending) {
    return (
      <section className="bg-[#f4f1eb] px-5 py-8 text-[#252422] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <ProjectGallerySlideSkeleton />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <p className="px-5 text-center text-sm text-muted-foreground sm:px-8 lg:px-16">
        Não foi possível carregar os projetos.
      </p>
    )
  }

  const projects = data.pages.flatMap((page) => page.projects)

  return (
    <div className="flex flex-col">
      <ProjectGallery projects={projects} featuredCount={5} showPromoted />
      <div className="bg-[#f4f1eb] px-5 pb-8 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-7xl">
          {isFetchingNextPage ? <HomeProjectsLoadMoreSkeleton /> : null}
          {hasNextPage ? <div ref={loadMoreRef} className="h-1" aria-hidden /> : null}
        </div>
      </div>
    </div>
  )
}
