/**
 * OCPP Simulator store — Zustand v5
 *
 * WebSocket instances live in a module-level Map (non-serialisable, intentionally
 * outside Zustand) keyed by chargerId.  Everything else is tracked in Zustand state.
 */

import {
  buildAuthorize,
  buildBootNotification,
  buildDataTransfer,
  buildHeartbeat,
  buildMeterValues,
  buildStartTransaction,
  buildStatusNotification,
  buildStopTransaction,
  randomMsgId,
} from '@/lib/ocpp-messages'
import type {
  ChargerState,
  LogEntry,
  LogType,
  OcppMessage,
  TimelineEntry,
  Transaction,
} from '@/types/ocpp'
import { toast } from 'sonner'
import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'

// ─── Non-serialisable singletons ────────────────────────────────────────────
const wsMap = new Map<string, WebSocket>()
const autoLoopMap = new Map<string, ReturnType<typeof setInterval>>()
let chargerCount = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeLog(
  type: LogType,
  label: string,
  message: string,
  action?: string,
  raw?: string,
): LogEntry {
  return {
    id: randomMsgId(),
    timestamp: new Date(),
    type,
    label,
    message,
    action,
    raw,
  }
}

function makeTimeline(
  direction: 'tx' | 'rx',
  action: string,
  messageId: string,
  payload: unknown,
  status: TimelineEntry['status'] = 'pending',
): TimelineEntry {
  return {
    id: randomMsgId(),
    timestamp: new Date(),
    direction,
    action,
    messageId,
    payload,
    status,
  }
}

function defaultCharger(url?: string): ChargerState {
  chargerCount++
  return {
    id: randomMsgId(),
    name: `Charger ${chargerCount}`,
    url: url ?? 'wss://api-ocpp.bs-group.tech/ocpp/{serial_number}',
    rfidTag: 'MACXAAAA100',
    connectorUid: '1',
    transactionId: null,
    connectorStatus: 'Available',
    connectionState: 'disconnected',
    lastAction: null,
    meterValue: 1000,
    meterIncrement: 10,
    meterInterval: 1000,
    meterSendCount: 5,
    logs: [
      makeLog(
        'system',
        'SYS',
        'Ready. Awaiting connection to Central System...',
      ),
    ],
    timeline: [],
    transactions: [],
    loadingButtons: {},
  }
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface OcppStore {
  chargers: Record<string, ChargerState>
  activeChargerId: string

  // Charger management
  addCharger: () => void
  removeCharger: (id: string) => void
  setActiveCharger: (id: string) => void
  updateCharger: (id: string, patch: Partial<ChargerState>) => void

  // Connection
  connect: (id: string) => void
  disconnect: (id: string) => void

  // Actions
  authorize: (id: string) => void
  startTransaction: (id: string) => void
  stopTransaction: (id: string) => void
  sendHeartbeat: (id: string) => void
  sendMeterValue: (id: string) => void
  sendStatusNotification: (id: string) => void
  sendDataTransfer: (id: string) => void
  sendRawMessage: (id: string, raw: string) => void

  // Auto loop
  startAutoLoop: (id: string) => void
  stopAutoLoop: (id: string) => void

  // Helpers
  clearLogs: (id: string) => void
}

// ─── Zustand Store ────────────────────────────────────────────────────────────
export const useOcppStore = create<OcppStore>()((set, get) => {
  // — internal helpers that mutate Zustand state ———————————————————————————

  function addLog(id: string, log: LogEntry) {
    set((s) => ({
      chargers: {
        ...s.chargers,
        [id]: { ...s.chargers[id], logs: [...s.chargers[id].logs, log] },
      },
    }))
  }

  function addTimeline(id: string, entry: TimelineEntry) {
    set((s) => ({
      chargers: {
        ...s.chargers,
        [id]: {
          ...s.chargers[id],
          timeline: [...s.chargers[id].timeline, entry],
        },
      },
    }))
  }

  function updateTimeline(
    id: string,
    messageId: string,
    status: TimelineEntry['status'],
  ) {
    set((s) => ({
      chargers: {
        ...s.chargers,
        [id]: {
          ...s.chargers[id],
          timeline: s.chargers[id].timeline.map((e) =>
            e.messageId === messageId ? { ...e, status } : e,
          ),
        },
      },
    }))
  }

  function setLoading(id: string, btn: string, val: boolean) {
    set((s) => ({
      chargers: {
        ...s.chargers,
        [id]: {
          ...s.chargers[id],
          loadingButtons: { ...s.chargers[id].loadingButtons, [btn]: val },
        },
      },
    }))
  }

  function getCharger(id: string): ChargerState {
    return get().chargers[id]
  }

  function send(id: string, raw: string, action: string) {
    const ws = wsMap.get(id)
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error('Not connected!')
      addLog(id, makeLog('error', 'ERR', 'Not connected!'))
      return
    }
    ws.send(raw)
    const parsed = JSON.parse(raw) as OcppMessage
    const msgId = parsed[1] as string
    addLog(id, makeLog('tx', 'TX', raw, action, raw))
    addTimeline(id, makeTimeline('tx', action, msgId, parsed[3]))
    set((s) => ({
      chargers: {
        ...s.chargers,
        [id]: { ...s.chargers[id], lastAction: action },
      },
    }))
  }

  // — Incoming message handler ——————————————————————————————————————————————

  function handleMessage(id: string, rawData: string) {
    addLog(id, makeLog('rx', 'RX', rawData))
    const ddata = JSON.parse(rawData) as OcppMessage

    set((s) => {
      // flash blue — represented in UI by reading lastFlash timestamp
      return s
    })

    if (ddata[0] === 3) {
      // CallResult
      const msgId = ddata[1]
      const result = ddata[2] as Record<string, unknown>
      const la = getCharger(id).lastAction

      updateTimeline(id, msgId, 'accepted')

      if (la === 'BootNotification') {
        toast.success('BootNotification Accepted')
      } else if (la === 'Authorize') {
        setLoading(id, 'authorize', false)
        const status = (result.idTagInfo as Record<string, unknown>)?.status
        if (status === 'Accepted') toast.success('Authorization Accepted')
        else toast.error('Authorization Rejected')
      } else if (la === 'StartTransaction') {
        setLoading(id, 'start', false)
        const txId = result.transactionId as number
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: {
              ...s.chargers[id],
              transactionId: txId,
              connectorStatus: 'Charging',
              connectionState: 'charging',
              transactions: [
                ...s.chargers[id].transactions,
                {
                  id: txId,
                  idTag: s.chargers[id].rfidTag,
                  connectorId: parseInt(s.chargers[id].connectorUid),
                  startTime: new Date(),
                  meterStart: s.chargers[id].meterValue,
                  status: 'active',
                } as Transaction,
              ],
            },
          },
        }))
        toast.success('Transaction Started!')
        addLog(
          id,
          makeLog('system', 'SYS', `Transaction Approved! ID: ${txId}`),
        )
      } else if (la === 'StopTransaction') {
        setLoading(id, 'stop', false)
        set((s) => {
          const c = s.chargers[id]
          return {
            chargers: {
              ...s.chargers,
              [id]: {
                ...c,
                connectorStatus: 'Finishing',
                connectionState: 'connected',
                transactions: c.transactions.map((t) =>
                  t.status === 'active'
                    ? {
                        ...t,
                        endTime: new Date(),
                        meterStop: c.meterValue,
                        status: 'completed' as const,
                      }
                    : t,
                ),
              },
            },
          }
        })
        toast.success('Transaction Stopped!')
      } else if (la === 'Heartbeat') {
        setLoading(id, 'heartbeat', false)
        toast.info('Heartbeat Acknowledged')
      } else if (la === 'StatusNotification') {
        setLoading(id, 'status', false)
        toast.success('Status Notified')
      } else if (la === 'DataTransfer') {
        setLoading(id, 'dataTransfer', false)
        toast.success('Data Transfer Completed')
      } else if (la === 'MeterValues') {
        setLoading(id, 'meterValue', false)
        toast.success('Meter Value Sent')
      }
    } else if (ddata[0] === 4) {
      // CallError
      const msgId = ddata[1]
      updateTimeline(id, msgId, 'error')
      toast.error('Server returned an error!')
      addLog(id, makeLog('error', 'ERR', 'CallError: ' + JSON.stringify(ddata)))
      ;[
        'authorize',
        'start',
        'stop',
        'heartbeat',
        'meterValue',
        'status',
        'dataTransfer',
      ].forEach((b) => setLoading(id, b, false))
    } else if (ddata[0] === 2) {
      // Call from server
      const serverMsgId = ddata[1] as string
      const action = ddata[2] as string
      const params = ddata[3] as Record<string, unknown>

      addTimeline(
        id,
        makeTimeline('rx', action, serverMsgId, params, 'accepted'),
      )

      const ws = wsMap.get(id)
      if (!ws) return

      switch (action) {
        case 'Reset':
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
          toast.warning('Reset requested. Reloading...')
          addLog(id, makeLog('system', 'SYS', 'Reset requested. Reloading...'))
          setTimeout(() => window.location.reload(), 2000)
          break
        case 'RemoteStopTransaction':
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
          if (params.transactionId) {
            set((s) => ({
              chargers: {
                ...s.chargers,
                [id]: {
                  ...s.chargers[id],
                  transactionId: params.transactionId as number,
                },
              },
            }))
          }
          get().stopTransaction(id)
          break
        case 'RemoteStartTransaction':
          set((s) => ({
            chargers: {
              ...s.chargers,
              [id]: {
                ...s.chargers[id],
                rfidTag: (params.idTag as string) ?? s.chargers[id].rfidTag,
              },
            },
          }))
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
          get().startTransaction(id)
          break
        case 'UnlockConnector':
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Unlocked' }]))
          toast.info('Connector Unlocked by Remote')
          addLog(id, makeLog('system', 'SYS', 'Connector Unlocked'))
          break
        case 'TriggerMessage':
          if (params.requestedMessage === 'MeterValues') {
            ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
            get().sendMeterValue(id)
          } else {
            ws.send(JSON.stringify([4, serverMsgId, 'NotImplemented', '', {}]))
          }
          break
        case 'GetConfiguration':
          ws.send(
            JSON.stringify([
              3,
              serverMsgId,
              { configurationKey: [], unknownKey: [] },
            ]),
          )
          break
        case 'ChangeConfiguration':
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
          break
        case 'ClearCache':
          ws.send(JSON.stringify([3, serverMsgId, { status: 'Accepted' }]))
          toast.info('ClearCache requested')
          break
        default:
          ws.send(JSON.stringify([4, serverMsgId, 'NotImplemented', '', {}]))
          addLog(id, makeLog('system', 'SYS', `Unhandled action: ${action}`))
          break
      }
    }
  }

  // — Initial state & actions ———————————————————————————————————————————————
  const firstCharger = defaultCharger()

  return {
    chargers: { [firstCharger.id]: firstCharger },
    activeChargerId: firstCharger.id,

    addCharger() {
      const c = defaultCharger()
      set((s) => ({
        chargers: { ...s.chargers, [c.id]: c },
        activeChargerId: c.id,
      }))
    },

    removeCharger(id) {
      const ws = wsMap.get(id)
      if (ws) {
        ws.close(3001)
        wsMap.delete(id)
      }
      const loop = autoLoopMap.get(id)
      if (loop) {
        clearInterval(loop)
        autoLoopMap.delete(id)
      }
      set((s) => {
        const chargers = { ...s.chargers }
        delete chargers[id]
        const ids = Object.keys(chargers)
        return { chargers, activeChargerId: ids[ids.length - 1] ?? '' }
      })
    },

    setActiveCharger(id) {
      set({ activeChargerId: id })
    },

    updateCharger(id, patch) {
      set((s) => ({
        chargers: { ...s.chargers, [id]: { ...s.chargers[id], ...patch } },
      }))
    },

    connect(id) {
      const c = getCharger(id)
      if (!c) return

      if (wsMap.has(id)) {
        wsMap.get(id)!.close(3001)
        return
      }

      set((s) => ({
        chargers: {
          ...s.chargers,
          [id]: { ...s.chargers[id], connectionState: 'connecting' },
        },
      }))
      addLog(id, makeLog('system', 'SYS', `Connecting to: ${c.url}`))

      let ws: WebSocket
      try {
        ws = new WebSocket(c.url, ['ocpp1.6', 'ocpp1.5'])
      } catch (e) {
        toast.error('WebSocket Creation Error!')
        addLog(id, makeLog('error', 'ERR', `WebSocket creation error: ${e}`))
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: { ...s.chargers[id], connectionState: 'disconnected' },
          },
        }))
        return
      }

      wsMap.set(id, ws)

      ws.onopen = () => {
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: { ...s.chargers[id], connectionState: 'connected' },
          },
        }))
        toast.success('Connected to Central System')
        addLog(id, makeLog('system', 'SYS', 'WebSocket connected'))
        // Send BootNotification immediately
        const msgId = randomMsgId()
        const raw = buildBootNotification(msgId)
        ws.send(raw)
        addLog(id, makeLog('tx', 'TX', raw, 'BootNotification', raw))
        addTimeline(id, makeTimeline('tx', 'BootNotification', msgId, {}))
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: { ...s.chargers[id], lastAction: 'BootNotification' },
          },
        }))
      }

      ws.onmessage = (evt) => handleMessage(id, evt.data as string)

      ws.onclose = (evt) => {
        wsMap.delete(id)
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: { ...s.chargers[id], connectionState: 'disconnected' },
          },
        }))
        if (evt.code === 3001) {
          addLog(id, makeLog('system', 'SYS', 'WebSocket closed manually'))
          toast.info('Disconnected manually')
        } else {
          addLog(id, makeLog('error', 'ERR', `WebSocket closed: ${evt.code}`))
          toast.error('Connection Closed/Error')
        }
      }

      ws.onerror = () => {
        addLog(id, makeLog('error', 'ERR', 'WebSocket error'))
      }
    },

    disconnect(id) {
      const ws = wsMap.get(id)
      if (ws) ws.close(3001)
    },

    authorize(id) {
      const c = getCharger(id)
      setLoading(id, 'authorize', true)
      const msgId = randomMsgId()
      send(id, buildAuthorize(msgId, c.rfidTag), 'Authorize')
    },

    startTransaction(id) {
      const c = getCharger(id)
      setLoading(id, 'start', true)
      set((s) => ({
        chargers: {
          ...s.chargers,
          [id]: { ...s.chargers[id], connectionState: 'charging' },
        },
      }))
      const msgId = randomMsgId()
      send(
        id,
        buildStartTransaction(
          msgId,
          parseInt(c.connectorUid),
          c.rfidTag,
          c.meterValue,
        ),
        'StartTransaction',
      )
    },

    stopTransaction(id) {
      const c = getCharger(id)
      if (c.transactionId === null) {
        toast.error('No active transaction')
        return
      }
      setLoading(id, 'stop', true)
      set((s) => ({
        chargers: {
          ...s.chargers,
          [id]: { ...s.chargers[id], connectionState: 'connected' },
        },
      }))
      const msgId = randomMsgId()
      send(
        id,
        buildStopTransaction(msgId, c.transactionId, c.rfidTag, c.meterValue),
        'StopTransaction',
      )
    },

    sendHeartbeat(id) {
      setLoading(id, 'heartbeat', true)
      const msgId = randomMsgId()
      send(id, buildHeartbeat(msgId), 'Heartbeat')
    },

    sendMeterValue(id) {
      const c = getCharger(id)
      setLoading(id, 'meterValue', true)
      const msgId = randomMsgId()
      send(
        id,
        buildMeterValues(
          msgId,
          parseInt(c.connectorUid),
          c.transactionId ?? 0,
          c.meterValue,
        ),
        'MeterValues',
      )
    },

    sendStatusNotification(id) {
      const c = getCharger(id)
      setLoading(id, 'status', true)
      const msgId = randomMsgId()
      send(
        id,
        buildStatusNotification(
          msgId,
          parseInt(c.connectorUid),
          c.connectorStatus,
        ),
        'StatusNotification',
      )
    },

    sendDataTransfer(id) {
      setLoading(id, 'dataTransfer', true)
      const msgId = randomMsgId()
      send(id, buildDataTransfer(msgId), 'DataTransfer')
    },

    sendRawMessage(id, raw) {
      const ws = wsMap.get(id)
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        toast.error('Not connected!')
        addLog(id, makeLog('error', 'ERR', 'Not connected!'))
        return
      }
      try {
        const parsed = JSON.parse(raw) as OcppMessage
        ws.send(raw)
        const msgId = parsed[1] as string
        const action = (parsed[2] as string) ?? 'Raw'
        addLog(id, makeLog('tx', 'TX', raw, action, raw))
        addTimeline(id, makeTimeline('tx', action, msgId, parsed[3] ?? {}))
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: { ...s.chargers[id], lastAction: action },
          },
        }))
      } catch {
        toast.error('Invalid JSON message')
        addLog(id, makeLog('error', 'ERR', 'Invalid JSON: ' + raw))
      }
    },

    startAutoLoop(id) {
      if (autoLoopMap.has(id)) return
      const c = getCharger(id)
      const { meterInterval, meterSendCount, meterIncrement } = c
      let timesRun = 0

      addLog(
        id,
        makeLog(
          'system',
          'SYS',
          `Auto Loop started (${meterSendCount}x, every ${meterInterval}ms, +${meterIncrement} Wh)`,
        ),
      )
      toast.success('Auto Loop Started')

      const interval = setInterval(() => {
        timesRun++
        set((s) => ({
          chargers: {
            ...s.chargers,
            [id]: {
              ...s.chargers[id],
              meterValue:
                s.chargers[id].meterValue + s.chargers[id].meterIncrement,
            },
          },
        }))
        get().sendMeterValue(id)

        if (timesRun >= meterSendCount) {
          get().stopAutoLoop(id)
          toast.success('Auto Loop Completed')
          addLog(id, makeLog('system', 'SYS', 'Auto Loop Completed'))
        }
      }, meterInterval)

      autoLoopMap.set(id, interval)
    },

    stopAutoLoop(id) {
      const loop = autoLoopMap.get(id)
      if (loop) {
        clearInterval(loop)
        autoLoopMap.delete(id)
      }
    },

    clearLogs(id) {
      set((s) => ({
        chargers: {
          ...s.chargers,
          [id]: { ...s.chargers[id], logs: [], timeline: [] },
        },
      }))
    },
  }
})

// Atomic selectors
export const useChargers = () => useOcppStore((s) => s.chargers)
export const useActiveChargerId = () => useOcppStore((s) => s.activeChargerId)
export const useActiveCharger = () =>
  useOcppStore((s) => s.chargers[s.activeChargerId])
export const useCharger = (id: string) => useOcppStore((s) => s.chargers[id])
export const useOcppActions = () =>
  useOcppStore(
    useShallow((s) => ({
      addCharger: s.addCharger,
      removeCharger: s.removeCharger,
      setActiveCharger: s.setActiveCharger,
      updateCharger: s.updateCharger,
      connect: s.connect,
      disconnect: s.disconnect,
      authorize: s.authorize,
      startTransaction: s.startTransaction,
      stopTransaction: s.stopTransaction,
      sendHeartbeat: s.sendHeartbeat,
      sendMeterValue: s.sendMeterValue,
      sendStatusNotification: s.sendStatusNotification,
      sendDataTransfer: s.sendDataTransfer,
      sendRawMessage: s.sendRawMessage,
      startAutoLoop: s.startAutoLoop,
      stopAutoLoop: s.stopAutoLoop,
      clearLogs: s.clearLogs,
    })),
  )

export const isAutoLooping = (id: string) => autoLoopMap.has(id)
