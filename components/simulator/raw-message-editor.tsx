'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { randomMsgId } from '@/lib/ocpp-messages'
import { useCharger, useOcppActions } from '@/store/useStore'
import { PaperPlaneTilt, Sparkle, WarningCircle } from '@phosphor-icons/react'
import { useState } from 'react'

const EXAMPLE = (msgId: string) =>
  JSON.stringify([2, msgId, 'Heartbeat', {}], null, 2)

interface RawMessageEditorProps {
  chargerId: string
}

export function RawMessageEditor({ chargerId }: RawMessageEditorProps) {
  const charger = useCharger(chargerId)
  const { sendRawMessage } = useOcppActions()
  const [value, setValue] = useState(() => EXAMPLE(randomMsgId()))
  const [error, setError] = useState<string | null>(null)

  if (!charger) return null

  const isConnected =
    charger.connectionState === 'connected' ||
    charger.connectionState === 'charging'

  function handlePrettify() {
    try {
      const parsed = JSON.parse(value)
      setValue(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleSend() {
    try {
      JSON.parse(value) // validate first
      setError(null)
      sendRawMessage(chargerId, value.replace(/\s+/g, ' ').trim())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleNewId() {
    try {
      const parsed = JSON.parse(value) as unknown[]
      parsed[1] = randomMsgId()
      setValue(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full gap-3 pt-1">
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        className="flex-1 text-xs resize-none min-h-50 bg-zinc/400 border-border/40"
        placeholder='[2, "msg-id", "Action", {...}]'
        spellCheck={false}
      />

      {error && (
        <Alert variant="destructive" className="py-2">
          <WarningCircle weight="fill" className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrettify}
          className="text-xs gap-1.5 bg-transparent hover:bg-transparent "
        >
          <Sparkle weight="fill" className="h-3.5 w-3.5" /> Prettify
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewId}
          className="text-xs gap-1 bg-transparent hover:bg-transparent  "
        >
          New ID
        </Button>
        <Button
          onClick={handleSend}
          disabled={!isConnected}
          size="sm"
          className="ml-auto gap-1.5 text-xs bg-transparent hover:bg-transparent"
        >
          <PaperPlaneTilt weight="fill" className="h-3.5 w-3.5 " /> Send
        </Button>
      </div>
    </div>
  )
}
