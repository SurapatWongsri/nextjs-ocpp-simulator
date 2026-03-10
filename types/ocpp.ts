export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'charging'

export type ConnectorStatus =
  | 'Available'
  | 'Preparing'
  | 'Charging'
  | 'SuspendedEV'
  | 'SuspendedEVSE'
  | 'Finishing'
  | 'Reserved'
  | 'Faulted'
  | 'Offline'

export type LogType = 'tx' | 'rx' | 'error' | 'system'

export interface LogEntry {
  id: string
  timestamp: Date
  type: LogType
  label: string
  message: string
  action?: string
  raw?: string
}

export interface TimelineEntry {
  id: string
  timestamp: Date
  direction: 'tx' | 'rx'
  action: string
  messageId: string
  payload: unknown
  status?: 'pending' | 'accepted' | 'rejected' | 'error'
}

export interface Transaction {
  id: number
  idTag: string
  connectorId: number
  startTime: Date
  endTime?: Date
  meterStart: number
  meterStop?: number
  status: 'active' | 'completed' | 'rejected'
}

export interface ChargerState {
  id: string
  name: string
  /** WebSocket URL, e.g. wss://api-ocpp.../ocpp/111 */
  url: string
  rfidTag: string
  connectorUid: string
  transactionId: number | null
  connectorStatus: ConnectorStatus
  connectionState: ConnectionState
  /** Tracks which OCPP action the last outbound Call was */
  lastAction: string | null
  meterValue: number
  meterIncrement: number
  meterInterval: number
  meterSendCount: number
  logs: LogEntry[]
  timeline: TimelineEntry[]
  transactions: Transaction[]
  loadingButtons: Record<string, boolean>
}

// OCPP wire-format types
export type OcppCall = [2, string, string, Record<string, unknown>]
export type OcppCallResult = [3, string, Record<string, unknown>]
export type OcppCallError = [4, string, string, string, Record<string, unknown>]
export type OcppMessage = OcppCall | OcppCallResult | OcppCallError
