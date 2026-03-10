'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCharger } from '@/store/useStore'

interface TransactionViewerProps {
  chargerId: string
}

export function TransactionViewer({ chargerId }: TransactionViewerProps) {
  const charger = useCharger(chargerId)
  if (!charger) return null

  const { transactions } = charger

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No transactions yet. Start a charging session.
      </div>
    )
  }

  function fmt(d: Date) {
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-16">ID</TableHead>
            <TableHead className="text-xs">idTag</TableHead>
            <TableHead className="text-xs">Start</TableHead>
            <TableHead className="text-xs">End</TableHead>
            <TableHead className="text-xs text-right">Start Wh</TableHead>
            <TableHead className="text-xs text-right">Stop Wh</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...transactions].reverse().map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-xs">{tx.id}</TableCell>
              <TableCell className="font-mono text-xs">{tx.idTag}</TableCell>
              <TableCell className="font-mono text-xs">
                {fmt(tx.startTime)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {tx.endTime ? fmt(tx.endTime) : '—'}
              </TableCell>
              <TableCell className="font-mono text-xs text-right">
                {tx.meterStart}
              </TableCell>
              <TableCell className="font-mono text-xs text-right">
                {tx.meterStop ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5',
                    tx.status === 'active' &&
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    tx.status === 'completed' &&
                      'bg-slate-500/20 text-slate-400 border-slate-500/30',
                    tx.status === 'rejected' &&
                      'bg-rose-500/20 text-rose-400 border-rose-500/30',
                  )}
                >
                  {tx.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
