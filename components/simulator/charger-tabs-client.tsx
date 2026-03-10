'use client'

import dynamic from 'next/dynamic'

// Loaded on client only — prevents hydration mismatch from
// randomMsgId() + new Date() in Zustand store initialisation
const ChargerTabs = dynamic(
  () => import('./charger-tabs').then((m) => m.ChargerTabs),
  { ssr: false },
)

export function ChargerTabsClient() {
  return <ChargerTabs />
}
