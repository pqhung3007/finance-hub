import {
  type ISnapshot,
  type ITickersQuery,
  restClient,
} from '@polygon.io/client-js'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { stockKeys } from '@/lib/query-keys.ts'
import { useMemo } from 'react'

const rest = restClient(import.meta.env.VITE_API_POLY_KEY)

export type StockFilters = {
  search?: string
  exchange?: string
}

export type Stock = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

type Snapshot = ISnapshot['ticker']

export const POPULAR_STOCKS_COUNT = 8

function transformStockData(
  snapshot: Snapshot,
  tickerDetails?: { name: string }
): Stock {
  if (!snapshot) throw new Error('Snapshot not found')
  return {
    symbol: snapshot.ticker!,
    name: tickerDetails?.name || 'Unknown',
    price: snapshot.day?.c || 0,
    change: snapshot.todaysChange || 0,
    changePercent: snapshot.todaysChangePerc || 0,
    volume: snapshot.day?.v || 0,
  }
}

function createLookupMap<SnapshotInfo>({
  items,
  getKey,
}: {
  items: Array<SnapshotInfo>
  getKey: (item: SnapshotInfo) => string
}): Map<string, SnapshotInfo> {
  return new Map(items.map((item) => [getKey(item), item]))
}

const BASE_STOCK_FILTERS = {
  active: 'true',
  market: 'stocks',
  type: 'CS',
} as const

export const useSearchStocks = (filters: StockFilters) => {
  // keep the infinite query for tickers
  return useInfiniteQuery({
    queryKey: stockKeys.filtered(filters),
    queryFn: async ({ pageParam }) => {
      const tickersResponse = await rest.reference.tickers({
        ...BASE_STOCK_FILTERS,
        search: filters.search,
        exchange: filters.exchange,
        cursor: pageParam ?? undefined,
        limit: 50,
      })

      if (!tickersResponse.results?.length) {
        return {
          stocks: [],
          nextCursor: null,
        }
      }

      const tickers = tickersResponse.results.map((result) => result.ticker)

      const snapshotsResponse = await rest.stocks.snapshotAllTickers({
        tickers: tickers.join(','),
      })

      const snapshotMap = createLookupMap({
        items: snapshotsResponse.tickers || [],
        getKey: (snapshot) => snapshot.ticker!,
      })

      const tickerDetailsMap = createLookupMap({
        items: tickersResponse.results,
        getKey: (ticker) => ticker.ticker,
      })

      // transform the data
      const stocks = tickers.map((ticker) =>
        transformStockData(
          snapshotMap.get(ticker) || { ticker },
          tickerDetailsMap.get(ticker)
        )
      )

      return {
        stocks,
        nextCursor: tickersResponse.next_url
          ? tickersResponse.next_url.split('cursor=')[1]
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as ITickersQuery['cursor'],
    enabled: !!filters.search,
  })
}

export const usePopularStocks = () => {
  const POPULAR_TICKERS = 'AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA,BRK.A'

  const { data: tickerDetails } = useQuery({
    queryKey: stockKeys.popular(),
    queryFn: async () => {
      // try individual requests for better reliability
      const tickers = POPULAR_TICKERS.split(',')
      const responses = await Promise.all(
        tickers.map((ticker) =>
          rest.reference.tickers({
            ...BASE_STOCK_FILTERS,
            ticker,
          })
        )
      )
      return responses.flatMap((r) => r.results)
    },
  })

  const {
    data: snapshots,
    isError,
    error,
    isLoading,
  } = useQuery({
    queryKey: stockKeys.popular(),
    queryFn: async () => {
      const response = await rest.stocks.snapshotAllTickers({
        tickers: POPULAR_TICKERS,
      })
      return response.tickers
    },
  })

  const popularStocks = useMemo(() => {
    if (!tickerDetails || !snapshots) return []

    const detailsMap = createLookupMap({
      items: tickerDetails,
      getKey: (t) => t.ticker,
    })

    return snapshots
      .filter((s) => s.day && s.prevDay)
      .map((snapshot) =>
        transformStockData(snapshot, detailsMap.get(snapshot.ticker!))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, POPULAR_STOCKS_COUNT)
  }, [tickerDetails, snapshots])

  return {
    popularStocks,
    isPopularStocksError: isError,
    popularStocksError: error,
    isPopularStocksLoading: isLoading,
  }
}
