import { Separator } from '@/components/ui/separator'
import { ConnectionPanel } from './connection-panel'
import { ConsolePanel } from './console-panel'
import { IdentityPanel } from './identity-panel'
import { MeteringPanel } from './metering-panel'
import { OperationsPanel } from './operations-panel'

interface ChargerInstanceProps {
  chargerId: string
}

export function ChargerInstance({ chargerId }: ChargerInstanceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 items-start">
      {/* Left panel — natural flow, page scrolls */}
      <div className="flex flex-col">
        <ConnectionPanel chargerId={chargerId} />
        <Separator className="my-4" />
        <IdentityPanel chargerId={chargerId} />
        <Separator className="my-4" />
        <OperationsPanel chargerId={chargerId} />
        <Separator className="my-4" />
        <MeteringPanel chargerId={chargerId} />
      </div>

      {/* Right panel — sticky console, viewport height */}
      <div className="sticky top-20 h-[600px] lg:h-[calc(100dvh-5.5rem)]">
        <ConsolePanel chargerId={chargerId} />
      </div>
    </div>
  )
}
