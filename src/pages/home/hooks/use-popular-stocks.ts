import { useQuery } from '@tanstack/react-query'
import { snapshotKeys, stockKeys } from '@/lib/query-keys.ts'
import { useMemo } from 'react'
import { rest } from '@/lib/api.ts'
import { BASE_STOCK_FILTERS } from '@/lib/constants.ts'
import { createLookupMap, transformStockData } from '../utils.ts'

export const POPULAR_STOCKS_COUNT = 8

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
    queryKey: snapshotKeys.popular(),
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
