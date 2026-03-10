'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCharger, useOcppActions } from '@/store/useStore'
import { ArrowsClockwise, Plug, Power } from '@phosphor-icons/react'
import { StatusIndicator } from './status-indicator'

interface ConnectionPanelProps {
  chargerId: string
}

export function ConnectionPanel({ chargerId }: ConnectionPanelProps) {
  const charger = useCharger(chargerId)
  const { connect, disconnect, updateCharger } = useOcppActions()

  if (!charger) return null

  const isConnected =
    charger.connectionState === 'connected' ||
    charger.connectionState === 'charging'
  const isConnecting = charger.connectionState === 'connecting'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plug className="size-4" />
          Endpoint Connection
        </h3>
        <StatusIndicator state={charger.connectionState} />
      </div>
      <div className="flex gap-2">
        <Input
          value={charger.url}
          onChange={(e) => updateCharger(chargerId, { url: e.target.value })}
          placeholder="wss://server/ocpp/charger-id"
          className="text-sm flex-1 py-4"
          disabled={isConnected || isConnecting}
        />
        <Button
          onClick={() =>
            isConnected ? disconnect(chargerId) : connect(chargerId)
          }
          disabled={isConnecting}
          variant={isConnected ? 'destructive' : 'default'}
          size="lg"
          className="shrink-0 min-w-27.5"
        >
          {isConnecting ? (
            <>
              <ArrowsClockwise weight="fill" className="size-4 animate-spin" />
              Connecting
            </>
          ) : isConnected ? (
            <>
              <Power weight="fill" className="size-4" />
              Disconnect
            </>
          ) : (
            <>
              <Plug weight="fill" className="size-4" />
              Connect
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
