'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCharger, useOcppActions } from '@/store/useStore'
import {
  ArrowCounterClockwise,
  Gauge,
  PaperPlaneTilt,
  Robot,
  StopCircle,
} from '@phosphor-icons/react'
import { useState } from 'react'

interface MeteringPanelProps {
  chargerId: string
}

export function MeteringPanel({ chargerId }: MeteringPanelProps) {
  const charger = useCharger(chargerId)
  const { updateCharger, sendMeterValue, startAutoLoop, stopAutoLoop } =
    useOcppActions()
  const [looping, setLooping] = useState(false)

  if (!charger) return null

  const isConnected =
    charger.connectionState === 'connected' ||
    charger.connectionState === 'charging'

  function handleToggleLoop() {
    if (looping) {
      stopAutoLoop(chargerId)
      setLooping(false)
    } else {
      startAutoLoop(chargerId)
      setLooping(true)
      // Auto-reset flag once done
      const total = charger.meterInterval * charger.meterSendCount + 500
      setTimeout(() => setLooping(false), total)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Gauge weight="fill" className="size-4" />
        Energy Metering
      </h3>
      {/* Main meter display */}
      <div className="relative">
        <Input
          value={charger.meterValue}
          onChange={(e) =>
            updateCharger(chargerId, {
              meterValue: Number(e.target.value) || 0,
            })
          }
          className="font-mono text-right pr-12 h-12"
          type="number"
          min={0}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground ">
          Wh
        </span>
      </div>

      <Button
        onClick={() => sendMeterValue(chargerId)}
        disabled={!isConnected || charger.loadingButtons.meterValue}
        variant="secondary"
        size="lg"
        className="w-full gap-1.5"
      >
        <PaperPlaneTilt weight="fill" className="size-3.5" /> Send Current Meter
        Value
      </Button>

      <Separator />

      {/* Auto Loop */}
      <div className="rounded-lg border p-3 space-y-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Robot weight="fill" className="size-3.5" />
            Auto Loop Simulator
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase text-center block">
              Step (Wh)
            </Label>
            <Input
              value={charger.meterIncrement}
              onChange={(e) =>
                updateCharger(chargerId, {
                  meterIncrement: Number(e.target.value) || 10,
                })
              }
              className="font-mono text-xs text-center h-7 px-1"
              type="number"
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase text-center block">
              Interval (ms)
            </Label>
            <Input
              value={charger.meterInterval}
              onChange={(e) =>
                updateCharger(chargerId, {
                  meterInterval: Number(e.target.value) || 1000,
                })
              }
              className="font-mono text-xs text-center h-7 px-1"
              type="number"
              min={100}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase text-center block">
              Count
            </Label>
            <Input
              value={charger.meterSendCount}
              onChange={(e) =>
                updateCharger(chargerId, {
                  meterSendCount: Number(e.target.value) || 5,
                })
              }
              className="font-mono text-xs text-center h-7 px-1"
              type="number"
              min={1}
            />
          </div>
        </div>

        <Button
          onClick={handleToggleLoop}
          disabled={!isConnected}
          size="lg"
          variant={looping ? 'destructive' : 'secondary'}
          className="w-full gap-1.5 text-xs"
        >
          {looping ? (
            <>
              <StopCircle weight="fill" className="size-3.5" /> Stop Auto Loop
            </>
          ) : (
            <>
              <ArrowCounterClockwise weight="fill" className="size-3.5" /> Start
              Auto Loop
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
