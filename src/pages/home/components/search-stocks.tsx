import { useSearchParams } from 'react-router'
import type { StockFilters } from '@/lib/types'
import { useSearchStocks } from '@/pages/home/hooks/use-search-stocks'
import { useCallback, useEffect, useRef } from 'react'
import { QUERY_PARAMS } from '@/lib/constants'
import { StockCardSkeleton } from './stock-card-skeleton'
import { StockCardSkeletonList } from './stock-card-skeleton-list'
import { StockCard } from './stock-card'

export function SearchStocks() {
  const [searchParams] = useSearchParams()
  const exchange = searchParams.get(QUERY_PARAMS.EXCHANGE) || ''
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || ''

  const stockFilters: StockFilters = {
    exchange,
    search,
  }

  const {
    data,
    isLoading,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useSearchStocks(stockFilters)

  const stocks = data?.pages.flatMap((page) => page.stocks) ?? []

  // keep track of the current observer
  const currentObserver = useRef<IntersectionObserver | null>(null)

  // inline ref callback
  const handleSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // always clean up previous observer
      if (currentObserver.current) {
        currentObserver.current.disconnect()
      }

      if (!node || !hasNextPage || isFetching) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            void fetchNextPage()
          }
        },
        { threshold: 0.5 }
      )
      observer.observe(node)
      currentObserver.current = observer
    },
    [fetchNextPage, hasNextPage, isFetching]
  )

  // clean up observer on unmount
  useEffect(() => {
    return () => {
      if (currentObserver.current) currentObserver.current.disconnect()
    }
  }, [])

  if (isLoading) {
    return <StockCardSkeletonList count={30} />
  }

  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-2xl font-bold">Error loading stocks</p>
        <p className="text-lg text-gray-600">{error?.message}</p>
      </div>
    )
  }

  if (!stocks.length) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-2xl font-bold">No results found</p>
        <p className="text-lg text-gray-600">
          Try different search terms or filters
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>

      {isFetching && (
        // Show skeleton cards in the same grid layout
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StockCardSkeleton key={index} />
          ))}
        </div>
      )}

      {hasNextPage && (
        // Invisible sentinel for intersection observer
        <div
          ref={handleSentinelRef}
          className="h-10 w-full"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
