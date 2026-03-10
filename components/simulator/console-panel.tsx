'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useCharger, useOcppActions } from '@/store/useStore'
import type { LogEntry } from '@/types/ocpp'
import { Code, GitBranch, Receipt, TerminalIcon } from '@phosphor-icons/react'
import { Trash } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MessageTimeline } from './message-timeline'
import { RawMessageEditor } from './raw-message-editor'
import { TransactionViewer } from './transaction-viewer'

const LOG_COLOR: Record<string, string> = {
  tx: 'log-tx',
  rx: 'log-rx',
  error: 'log-err',
  system: 'log-sys',
}

const LOG_BADGE: Record<string, string> = {
  tx: 'log-badge-tx',
  rx: 'log-badge-rx',
  error: 'log-badge-err',
  system: 'log-badge-sys',
}

function LogLine({ entry }: { entry: LogEntry }) {
  const time = entry.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })

  return (
    <li className="flex gap-2 items-baseline font-mono text-[12px] leading-relaxed">
      <span className="shrink-0 text-muted-foreground/60">[{time}]</span>
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 rounded px-1 py-0 text-[10px] font-bold leading-none h-4',
          LOG_BADGE[entry.type],
        )}
      >
        {entry.label}
      </Badge>
      <span className={cn(LOG_COLOR[entry.type])}>{entry.message}</span>
    </li>
  )
}

interface ConsolePanelProps {
  chargerId: string
}

export function ConsolePanel({ chargerId }: ConsolePanelProps) {
  const charger = useCharger(chargerId)
  const { clearLogs } = useOcppActions()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [charger?.logs.length])

  if (!charger) return null

  return (
    <Card className="h-full flex flex-col overflow-hidden bg-background shadow-sm">
      <Tabs defaultValue="console" className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b px-2 shrink-0">
          <div className="flex items-center gap-1 m-4">
            <TabsList className="h-9 bg-transparent p-0 gap-0">
              {[
                {
                  value: 'console',
                  icon: <TerminalIcon className="size-3.5" />,
                  label: 'Console',
                },
                {
                  value: 'timeline',
                  icon: <GitBranch className="size-3.5" />,
                  label: 'Timeline',
                },
                {
                  value: 'transactions',
                  icon: <Receipt className="size-3.5" />,
                  label: 'Transactions',
                },
                {
                  value: 'raw',
                  icon: <Code weight="fill" className="size-3.5" />,
                  label: 'Raw JSON',
                },
              ].map(({ value, icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-10 rounded-none px-4 font-semibold text-xs gap-1.5 text-muted-foreground/80 bg-transparent! border-none! shadow-none! data-[state=active]:text-primary hover:text-foreground/80"
                >
                  {icon} {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => clearLogs(chargerId)}
          >
            <Trash className="size-3.5" />
          </Button>
        </div>

        {/* Console — always dark */}
        <TabsContent value="console" className="flex-1 overflow-hidden m-0">
          <div ref={scrollAreaRef} className="h-full">
            <ScrollArea className="h-full">
              <ul className="p-4 space-y-1">
                {charger.logs.map((entry) => (
                  <LogLine key={entry.id} entry={entry} />
                ))}
              </ul>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent
          value="timeline"
          className="flex-1 overflow-hidden m-0 p-4"
        >
          <MessageTimeline chargerId={chargerId} />
        </TabsContent>

        <TabsContent
          value="transactions"
          className="flex-1 overflow-hidden m-0"
        >
          <TransactionViewer chargerId={chargerId} />
        </TabsContent>

        <TabsContent value="raw" className="flex-1 overflow-hidden m-0 p-4">
          <RawMessageEditor chargerId={chargerId} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
