/**
 * Pure message builder functions for OCPP 1.6 JSON protocol.
 * Each function returns a serialisable tuple ready to be JSON.stringify'd.
 */

export function buildBootNotification(msgId: string) {
  return JSON.stringify([
    2,
    msgId,
    'BootNotification',
    {
      chargePointVendor: 'INFINITY-Systems',
      chargePointModel: 'NEXUS-Pro-AC',
      chargePointSerialNumber: 'INF.001.24',
      chargeBoxSerialNumber: 'INF.CB.001',
      firmwareVersion: '2.1.0',
      meterType: 'INF Digital Meter',
    },
  ])
}

export function buildAuthorize(msgId: string, idTag: string) {
  return JSON.stringify([2, msgId, 'Authorize', { idTag }])
}

export function buildStartTransaction(
  msgId: string,
  connectorId: number,
  idTag: string,
  meterStart: number,
) {
  return JSON.stringify([
    2,
    msgId,
    'StartTransaction',
    {
      connectorId,
      idTag,
      timestamp: new Date().toISOString(),
      meterStart,
      reservationId: 0,
    },
  ])
}

export function buildStopTransaction(
  msgId: string,
  transactionId: number,
  idTag: string,
  meterStop: number,
) {
  return JSON.stringify([
    2,
    msgId,
    'StopTransaction',
    {
      transactionId,
      idTag,
      timestamp: new Date().toISOString(),
      meterStop,
      reason: 'Local',
      transactionData: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              context: 'Sample.Periodic',
              format: 'Raw',
              location: 'Outlet',
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh',
              value: String(meterStop),
            },
          ],
        },
      ],
    },
  ])
}

export function buildHeartbeat(msgId: string) {
  return JSON.stringify([2, msgId, 'Heartbeat', {}])
}

export function buildMeterValues(
  msgId: string,
  connectorId: number,
  transactionId: number,
  meterValue: number,
) {
  return JSON.stringify([
    2,
    msgId,
    'MeterValues',
    {
      connectorId,
      transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              context: 'Sample.Periodic',
              format: 'Raw',
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh',
              value: String(meterValue),
            },
            {
              context: 'Sample.Periodic',
              format: 'Raw',
              location: 'EV',
              measurand: 'SoC',
              unit: 'Percent',
              value: '85',
            },
          ],
        },
      ],
    },
  ])
}

export function buildStatusNotification(
  msgId: string,
  connectorId: number,
  status: string,
) {
  return JSON.stringify([
    2,
    msgId,
    'StatusNotification',
    {
      connectorId,
      status,
      errorCode: 'NoError',
      info: '',
      timestamp: new Date().toISOString(),
      vendorId: '',
      vendorErrorCode: '',
    },
  ])
}

export function buildDataTransfer(msgId: string) {
  return JSON.stringify([
    2,
    msgId,
    'DataTransfer',
    {
      vendorId: 'INFINITY',
      messageId: 'CustomCommand',
      data: 'Test Payload',
    },
  ])
}

/** Generate a random 36-char alphanumeric message ID */
export function randomMsgId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 36; i++)
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  return id
}
