import { useSearchParams } from 'react-router'
import type { StockFilters } from '@/lib/types'
import { useIsFetching } from '@tanstack/react-query'
import { stockKeys } from '@/lib/query-keys'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QUERY_PARAMS } from '@/lib/constants'

const EXCHANGE_OPTIONS = [
  // New york stock exchange
  { label: 'NYSE', value: 'XNYS' },

  // Nasdaq
  { label: 'NASDAQ', value: 'XNAS' },

  // American stock exchange
  { label: 'AMEX', value: 'XASE' },
]

export function SearchForm() {
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
