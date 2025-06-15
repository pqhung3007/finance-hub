import {
  POPULAR_STOCKS_COUNT,
  usePopularStocks,
} from '../hooks/use-popular-stocks'
import { StockCard } from './stock-card'
import { StockCardSkeletonList } from './stock-card-skeleton-list'

export function PopularStocks() {
  const {
    isPopularStocksError,
    isPopularStocksLoading,
    popularStocks,
    popularStocksError,
  } = usePopularStocks()

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
