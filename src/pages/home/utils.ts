import type { Stock } from '@/lib/types.ts'
import type { ISnapshot } from '@polygon.io/client-js'

type Snapshot = ISnapshot['ticker']

export function transformStockData(
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

export function createLookupMap<SnapshotInfo>({
  items,
  getKey,
}: {
  items: Array<SnapshotInfo>
  getKey: (item: SnapshotInfo) => string
}): Map<string, SnapshotInfo> {
  return new Map(items.map((item) => [getKey(item), item]))
}
