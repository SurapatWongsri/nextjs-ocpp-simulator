'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCharger } from '@/store/useStore'
import type { TimelineEntry } from '@/types/ocpp'
import { ArrowDown, ArrowUp } from '@phosphor-icons/react'

const STATUS_BADGE: Record<NonNullable<TimelineEntry['status']>, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  error: 'bg-rose-600/20 text-rose-500 border-rose-600/30',
}

interface MessageTimelineProps {
  chargerId: string
}

export function MessageTimeline({ chargerId }: MessageTimelineProps) {
  const charger = useCharger(chargerId)
  if (!charger) return null

  const { timeline } = charger

  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No messages yet. Connect and send a command.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-2 pb-4">
        {timeline.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              'flex gap-3 p-2 rounded-lg border text-xs',
              entry.direction === 'tx'
                ? 'border-primary/20 bg-primary/5 ml-4'
                : 'border-emerald-500/20 bg-emerald-500/5 mr-4',
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'shrink-0 w-6 h-6 rounded flex items-center justify-center',
                entry.direction === 'tx'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-emerald-500/20 text-emerald-400',
              )}
            >
              {entry.direction === 'tx' ? (
                <ArrowUp weight="fill" className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown weight="fill" className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">
                  {entry.action}
                </span>
                {entry.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      STATUS_BADGE[entry.status],
                    )}
                  >
                    {entry.status}
                  </Badge>
                )}
                <span className="text-muted-foreground ml-auto shrink-0">
                  {entry.timestamp.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="font-mono text-muted-foreground truncate text-[10px]">
                {JSON.stringify(entry.payload)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
