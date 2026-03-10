'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  useActiveChargerId,
  useChargers,
  useOcppActions,
} from '@/store/useStore'
import { Lightning, Plus, X } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Label } from '../ui/label'
import { ChargerInstance } from './charger-instance'

function EditableTabName({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const { updateCharger } = useOcppActions()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setDraft(name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) updateCharger(id, { name: trimmed })
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
          e.stopPropagation()
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-20 bg-transparent outline-none border-b border-current text-xs"
        autoFocus
      />
    )
  }

  return (
    <span onDoubleClick={startEdit} title="Double-click to rename">
      {name}
    </span>
  )
}

export function ChargerTabs() {
  const chargers = useChargers()
  const activeId = useActiveChargerId()
  const { addCharger, removeCharger, setActiveCharger } = useOcppActions()

  const ids = Object.keys(chargers)
  return (
    <div className="w-full ">
      {/* Button bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto rounded-xl p-4 border shadow-sm bg-card">
        <Label className="font-semibold">Charger List :</Label>
        <div className="flex items-center gap-1 shrink-0">
          {ids.map((id) => {
            const c = chargers[id]
            const isActive = id === activeId
            return (
              <div key={id} className="relative group">
                <Button
                  variant={isActive ? 'dark' : 'outline'}
                  size="sm"
                  className="h-9 text-xs gap-1.5 pr-2 rounded-full"
                  onClick={() => setActiveCharger(id)}
                >
                  <Lightning weight="fill" className="h-3 w-3" />
                  <EditableTabName id={id} name={c.name} />
                  {ids.length > 1 && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCharger(id)
                      }}
                      className={cn(
                        'ml-0.5 rounded-xl p-0.5   transition-opacity',
                        isActive ? 'hover:bg-primary-foreground/20' : '',
                      )}
                      aria-label={`Remove ${c.name}`}
                    >
                      <X className="size-4" />
                    </span>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                onClick={addCharger}
              >
                <Plus className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add new charger simulator</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Panels */}
      {ids.map((id) => (
        <div key={id} className={id === activeId ? 'block' : 'hidden'}>
          <ChargerInstance chargerId={id} />
        </div>
      ))}
    </div>
  )
}
