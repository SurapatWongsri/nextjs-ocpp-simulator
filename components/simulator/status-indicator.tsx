'use client'

import { Badge } from '@/components/ui/badge'
import type { ConnectionState } from '@/types/ocpp'

const CONFIG: Record<
  ConnectionState,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    label: string
  }
> = {
  disconnected: { variant: 'destructive', label: 'Disconnected' },
  connecting: { variant: 'outline', label: 'Connecting…' },
  connected: { variant: 'secondary', label: 'Standby' },
  charging: { variant: 'default', label: 'Charging' },
}

export function StatusIndicator({ state }: { state: ConnectionState }) {
  const { variant, label } = CONFIG[state]
  return <Badge variant={variant}>{label}</Badge>
}
