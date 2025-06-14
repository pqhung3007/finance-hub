import {
  type ITickersQuery,
  restClient,
} from '@polygon.io/client-js'
import { useInfiniteQuery } from '@tanstack/react-query'
import { stockKeys } from '@/lib/query-keys.ts'
import { BASE_STOCK_FILTERS } from '@/lib/constants.ts'
import type { StockFilters } from '@/lib/types.ts'
import { createLookupMap, transformStockData } from '../utils'

const rest = restClient(import.meta.env.VITE_API_POLY_KEY)

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