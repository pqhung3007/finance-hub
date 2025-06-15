import type { Stock } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

export function StockCard({ stock }: { stock: Stock }) {
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
