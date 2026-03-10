'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCharger, useOcppActions } from '@/store/useStore'
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Broadcast,
  GameController,
  Heartbeat,
  IdentificationCard,
  Play,
  StopCircle,
} from '@phosphor-icons/react'

function ActionButton({
  onClick,
  loading,
  disabled,
  isConnected,
  children,
  tooltip,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  isConnected: boolean
  children: React.ReactNode
  tooltip?: string
}) {
  const btn = (
    <Button
      onClick={onClick}
      disabled={disabled || loading || !isConnected}
      variant="outline"
      size="sm"
      className="w-full text-xs gap-1.5"
    >
      {loading ? (
        <ArrowsClockwise weight="fill" className="h-3.5 w-3.5 animate-spin" />
      ) : null}
      {children}
    </Button>
  )
  if (!tooltip) return btn
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface OperationsPanelProps {
  chargerId: string
}

export function OperationsPanel({ chargerId }: OperationsPanelProps) {
  const charger = useCharger(chargerId)
  const {
    authorize,
    startTransaction,
    stopTransaction,
    sendHeartbeat,
    sendStatusNotification,
    sendDataTransfer,
  } = useOcppActions()

  if (!charger) return null

  const isConnected =
    charger.connectionState === 'connected' ||
    charger.connectionState === 'charging'
  const lb = charger.loadingButtons

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <GameController weight="fill" className="size-4" />
        Core Operations
      </h3>
      {/* Row 1 — Auth & Status */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          onClick={() => authorize(chargerId)}
          loading={lb.authorize}
          isConnected={isConnected}
          tooltip="Send Authorize request"
        >
          <IdentificationCard weight="fill" className="size-3.5" /> Authorize
        </ActionButton>
        <ActionButton
          onClick={() => sendStatusNotification(chargerId)}
          loading={lb.status}
          isConnected={isConnected}
          tooltip="Send StatusNotification"
        >
          <Broadcast weight="fill" className="size-3.5" /> Status Notify
        </ActionButton>
      </div>

      <Separator />

      {/* Row 2 — Start / Stop TX */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => startTransaction(chargerId)}
          disabled={
            lb.start || !isConnected || charger.connectionState === 'charging'
          }
          size="lg"
          className="w-full"
        >
          {lb.start ? (
            <ArrowsClockwise weight="fill" className="size-4 animate-spin" />
          ) : (
            <Play weight="fill" className="size-4" />
          )}
          Start Transaction
        </Button>
        <Button
          onClick={() => stopTransaction(chargerId)}
          disabled={
            lb.stop || !isConnected || charger.connectionState !== 'charging'
          }
          size="lg"
          variant="destructive"
          className="w-full"
        >
          {lb.stop ? (
            <ArrowsClockwise weight="fill" className="size-4 animate-spin" />
          ) : (
            <StopCircle weight="fill" className="size-4" />
          )}
          Stop Transaction
        </Button>
      </div>

      <Separator />

      {/* Row 3 — Util */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          onClick={() => sendHeartbeat(chargerId)}
          loading={lb.heartbeat}
          isConnected={isConnected}
          tooltip="Send Heartbeat"
        >
          <Heartbeat weight="fill" className="size-3.5" /> Heartbeat
        </ActionButton>
        <ActionButton
          onClick={() => sendDataTransfer(chargerId)}
          loading={lb.dataTransfer}
          isConnected={isConnected}
          tooltip="Send DataTransfer"
        >
          <ArrowsLeftRight weight="fill" className="size-3.5" /> Data Transfer
        </ActionButton>
      </div>
    </div>
  )
}
