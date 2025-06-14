import { useCallback, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { POPULAR_STOCKS_COUNT } from './hooks/use-popular-stocks'
import type { Stock, StockFilters } from '@/lib/types'
import { useSearchStocks } from './hooks/use-search-stocks'
import { usePopularStocks } from './hooks/use-popular-stocks'
import { cn } from '@/lib/utils.ts'
import { useIsFetching } from '@tanstack/react-query'
import { stockKeys } from '@/lib/query-keys.ts'

// Type definitions for our data structures

const QUERY_PARAMS = {
  SEARCH: 'search',
  EXCHANGE: 'exchange',
} as const

const EXCHANGE_OPTIONS = [
  { label: 'NYSE', value: 'XNYS' },
  { label: 'NASDAQ', value: 'XNAS' },
  { label: 'AMEX', value: 'XASE' },
]

function StockCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-4 w-40" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function StockCardSkeletonList({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <StockCardSkeleton key={index} />
      ))}
    </div>
  )
}

function StockCard({ stock }: { stock: Stock }) {
  return (
    <Card key={stock.symbol} className="transition-shadow hover:shadow-lg">
      <Link to={`/stocks/${stock.symbol}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{stock.symbol}</span>
            <span
              className={cn(
                'text-lg',
                stock.change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              ${stock.price.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-gray-600">{stock.name}</p>

          {/* Price Change and Volume */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'flex items-center gap-1',
                stock.change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {stock.change >= 0 ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
            <span className="text-sm text-gray-600">
              {/* Divide by 10,000,000 to get millions */}
              Vol: {(stock.volume / 10_000_000).toFixed(1)}M
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

function SearchForm() {
  const [searchParams, setSearchParams] = useSearchParams()
  const exchange = searchParams.get(QUERY_PARAMS.EXCHANGE) || ''
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || ''

  const stockFilters: StockFilters = {
    exchange,
    search,
  }

  const handleExchangeChange = (newExchange: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (newExchange) {
        params.set(QUERY_PARAMS.EXCHANGE, newExchange)
      } else {
        params.delete(QUERY_PARAMS.EXCHANGE)
      }
      return params
    })
  }

  const isFetchingSearchStocks =
    useIsFetching({ queryKey: stockKeys.filtered(stockFilters) }) > 0

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isFetchingSearchStocks) return

    const formData = new FormData(e.target as HTMLFormElement)
    const searchValue = formData.get(QUERY_PARAMS.SEARCH) as string

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set(QUERY_PARAMS.EXCHANGE, searchValue)
      return params
    })
  }

  return (
    <div className="mb-4 flex items-center gap-4">
      <form
        onSubmit={handleSearchSubmit}
        className="flex grow items-center gap-2"
      >
        <Input
          name={QUERY_PARAMS.SEARCH}
          placeholder="Search stocks..."
          aria-label="Search stocks"
          defaultValue={search}
          className="w-64"
          required
        />
        <Button type="submit" disabled={isFetchingSearchStocks}>
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <Select value={exchange} onValueChange={handleExchangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Exchange" />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function SearchStocks() {
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

function PopularStocks() {
  const {
    isPopularStocksError,
    isPopularStocksLoading,
    popularStocks,
    popularStocksError,
  } = usePopularStocks()

  console.log(popularStocks)

  if (isPopularStocksLoading) {
    return <StockCardSkeletonList count={POPULAR_STOCKS_COUNT} />
  }

  if (isPopularStocksError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-2xl font-bold">Error loading popular stocks</p>
        <p className="text-lg text-gray-600">{popularStocksError?.message}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {popularStocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  )
}

export function HomePage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || ''

  const shouldShowSearchStocks = !!search

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">Financial Hub</h1>

      <SearchForm />

      <h2 className="text-2xl font-bold">Popular Stocks</h2>
      {shouldShowSearchStocks ? <SearchStocks /> : <PopularStocks />}
    </div>
  )
}
