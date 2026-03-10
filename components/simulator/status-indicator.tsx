'use client'

import {
  Status,
  StatusIndicator as StatusDot,
  StatusLabel,
} from '@/components/ui/status'
import type { ConnectionState } from '@/types/ocpp'

const CONFIG: Record<
  ConnectionState,
  {
    variant: 'default' | 'success' | 'error' | 'warning' | 'info'
    label: string
  }
> = {
  disconnected: { variant: 'error', label: 'Disconnected' },
  connecting: { variant: 'warning', label: 'Connecting…' },
  connected: { variant: 'success', label: 'Standby' },
  charging: { variant: 'info', label: 'Charging' },
}

export function StatusIndicator({ state }: { state: ConnectionState }) {
  const { variant, label } = CONFIG[state]
  return (
    <Status variant={variant}>
      <StatusDot />
      <StatusLabel>{label}</StatusLabel>
    </Status>
  )
}
