'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCharger, useOcppActions } from '@/store/useStore'
import type { ConnectorStatus } from '@/types/ocpp'
import { Hash, PlugCharging, SealCheck, Tag } from '@phosphor-icons/react'

const CONNECTOR_STATUSES: ConnectorStatus[] = [
  'Available',
  'Preparing',
  'Charging',
  'SuspendedEV',
  'SuspendedEVSE',
  'Finishing',
  'Reserved',
  'Faulted',
  'Offline',
]

interface IdentityPanelProps {
  chargerId: string
}

export function IdentityPanel({ chargerId }: IdentityPanelProps) {
  const charger = useCharger(chargerId)
  const { updateCharger, sendStatusNotification } = useOcppActions()

  if (!charger) return null

  const isConnected =
    charger.connectionState === 'connected' ||
    charger.connectionState === 'charging'

  function handleStatusChange(val: ConnectorStatus) {
    updateCharger(chargerId, { connectorStatus: val })
    if (isConnected) sendStatusNotification(chargerId)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <SealCheck weight="fill" className="h-4 w-4" />
        Charge Point Identity
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag weight="fill" className="h-3 w-3" /> RFID Tag
          </Label>
          <Input
            value={charger.rfidTag}
            onChange={(e) =>
              updateCharger(chargerId, { rfidTag: e.target.value })
            }
            className="font-mono text-sm h-8"
            placeholder="TAG"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <PlugCharging weight="fill" className="h-3 w-3" /> Connector UID
          </Label>
          <Input
            value={charger.connectorUid}
            onChange={(e) =>
              updateCharger(chargerId, { connectorUid: e.target.value })
            }
            className="font-mono text-sm h-8"
            placeholder="1"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Hash weight="fill" className="h-3 w-3" /> Transaction ID
          </Label>
          <Input
            value={charger.transactionId ?? '—'}
            readOnly
            className="font-mono text-sm h-8 text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Connector Status
          </Label>
          <Select
            value={charger.connectorStatus}
            onValueChange={(v) => handleStatusChange(v as ConnectorStatus)}
          >
            <SelectTrigger className="text-sm h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONNECTOR_STATUSES.map((statusValue) => (
                <SelectItem
                  key={statusValue}
                  value={statusValue}
                  className="text-sm"
                >
                  {statusValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
